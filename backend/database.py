import os
import json
import uuid
import copy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from bson import ObjectId
import pymongo
from pymongo import MongoClient
from backend.config import Config

LOCAL_STORE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "local_db_data.json")

def serialize_doc(doc: Any) -> Any:
    """Recursively convert ObjectIds and datetimes to serializable types."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                res[k] = str(v)
            elif isinstance(v, datetime):
                res[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                res[k] = serialize_doc(v)
            else:
                res[k] = v
        return res
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc

class LocalCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._sort_key = None
        self._sort_dir = 1
        self._skip_val = 0
        self._limit_val = None

    def sort(self, key_or_list: Union[str, List[tuple]], direction: int = 1):
        if isinstance(key_or_list, list):
            if len(key_or_list) > 0:
                self._sort_key = key_or_list[0][0]
                self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def skip(self, n: int):
        self._skip_val = max(0, n)
        return self

    def limit(self, n: int):
        self._limit_val = max(0, n)
        return self

    def _execute(self) -> List[Dict[str, Any]]:
        results = list(self._items)
        if self._sort_key:
            def sort_extractor(d):
                v = d.get(self._sort_key)
                if v is None:
                    return ""
                return str(v)
            results.sort(key=sort_extractor, reverse=(self._sort_dir == -1 or self._sort_dir == pymongo.DESCENDING))
        if self._skip_val:
            results = results[self._skip_val:]
        if self._limit_val is not None:
            results = results[:self._limit_val]
        return [copy.deepcopy(r) for r in results]

    def __iter__(self):
        return iter(self._execute())

    def __len__(self):
        return len(self._execute())

    def count(self):
        return len(self._items)

class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class InsertManyResult:
    def __init__(self, inserted_ids):
        self.inserted_ids = inserted_ids

class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int):
        self.matched_count = matched_count
        self.modified_count = modified_count

class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count

class LocalCollection:
    def __init__(self, name: str, parent_store: "LocalMongoStore"):
        self.name = name
        self.parent = parent_store

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, expected in query.items():
            if key == "$or":
                if not any(self._match(doc, subq) for subq in expected):
                    return False
                continue
            if key == "$and":
                if not all(self._match(doc, subq) for subq in expected):
                    return False
                continue

            # Nested key lookup
            val = doc
            for part in key.split("."):
                if isinstance(val, dict):
                    val = val.get(part)
                else:
                    val = None
                    break

            if isinstance(expected, dict):
                for op, op_val in expected.items():
                    if op == "$eq":
                        if str(val) != str(op_val):
                            return False
                    elif op == "$ne":
                        if str(val) == str(op_val):
                            return False
                    elif op == "$in":
                        str_op_vals = [str(x) for x in op_val]
                        if str(val) not in str_op_vals:
                            return False
                    elif op == "$nin":
                        str_op_vals = [str(x) for x in op_val]
                        if str(val) in str_op_vals:
                            return False
                    elif op == "$gt":
                        if val is None or val <= op_val:
                            return False
                    elif op == "$gte":
                        if val is None or val < op_val:
                            return False
                    elif op == "$lt":
                        if val is None or val >= op_val:
                            return False
                    elif op == "$lte":
                        if val is None or val > op_val:
                            return False
                    elif op == "$exists":
                        exists = (key in doc) if "." not in key else (val is not None)
                        if exists != bool(op_val):
                            return False
            else:
                # Direct equality check (supports string vs ObjectId / int)
                if str(val) != str(expected):
                    return False
        return True

    def find_one(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        items = self.parent.data.get(self.name, [])
        matched = [i for i in items if self._match(i, query)]
        if not matched:
            return None
        cursor = LocalCursor(matched)
        if sort:
            cursor.sort(sort)
        res = cursor._execute()
        return res[0] if res else None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> LocalCursor:
        query = query or {}
        items = self.parent.data.get(self.name, [])
        matched = [i for i in items if self._match(i, query)]
        return LocalCursor(matched)

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        items = self.parent.data.get(self.name, [])
        return sum(1 for i in items if self._match(i, query))

    def insert_one(self, doc: Dict[str, Any]) -> InsertOneResult:
        doc = copy.deepcopy(doc)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        else:
            doc["_id"] = str(doc["_id"])
        if "created_at" not in doc:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
        if "updated_at" not in doc:
            doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        self.parent.data.setdefault(self.name, []).append(doc)
        self.parent.save()
        return InsertOneResult(doc["_id"])

    def insert_many(self, docs: List[Dict[str, Any]]) -> InsertManyResult:
        ids = []
        for d in docs:
            res = self.insert_one(d)
            ids.append(res.inserted_id)
        return InsertManyResult(ids)

    def _apply_update(self, doc: Dict[str, Any], update: Dict[str, Any]):
        doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        if "$set" in update:
            for k, v in update["$set"].items():
                if "." in k:
                    parts = k.split(".")
                    cur = doc
                    for p in parts[:-1]:
                        cur = cur.setdefault(p, {})
                    cur[parts[-1]] = copy.deepcopy(v)
                else:
                    doc[k] = copy.deepcopy(v)
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v
        if "$push" in update:
            for k, v in update["$push"].items():
                doc.setdefault(k, []).append(copy.deepcopy(v))
        if "$pull" in update:
            for k, v in update["$pull"].items():
                if k in doc and isinstance(doc[k], list):
                    doc[k] = [x for x in doc[k] if x != v]
        if "$unset" in update:
            for k in update["$unset"]:
                doc.pop(k, None)

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> UpdateResult:
        items = self.parent.data.get(self.name, [])
        for doc in items:
            if self._match(doc, query):
                self._apply_update(doc, update)
                self.parent.save()
                return UpdateResult(1, 1)
        if upsert:
            new_doc = copy.deepcopy(query)
            self._apply_update(new_doc, update)
            self.insert_one(new_doc)
            return UpdateResult(0, 1)
        return UpdateResult(0, 0)

    def update_many(self, query: Dict[str, Any], update: Dict[str, Any]) -> UpdateResult:
        items = self.parent.data.get(self.name, [])
        matched = 0
        modified = 0
        for doc in items:
            if self._match(doc, query):
                matched += 1
                self._apply_update(doc, update)
                modified += 1
        if modified > 0:
            self.parent.save()
        return UpdateResult(matched, modified)

    def delete_one(self, query: Dict[str, Any]) -> DeleteResult:
        items = self.parent.data.get(self.name, [])
        for idx, doc in enumerate(items):
            if self._match(doc, query):
                items.pop(idx)
                self.parent.save()
                return DeleteResult(1)
        return DeleteResult(0)

    def delete_many(self, query: Dict[str, Any]) -> DeleteResult:
        items = self.parent.data.get(self.name, [])
        initial_len = len(items)
        self.parent.data[self.name] = [doc for doc in items if not self._match(doc, query)]
        deleted = initial_len - len(self.parent.data[self.name])
        if deleted > 0:
            self.parent.save()
        return DeleteResult(deleted)

    def create_index(self, keys, **kwargs):
        # Index creation is a no-op in local store but satisfies API
        return "index_created"

    def distinct(self, key: str, query: Optional[Dict[str, Any]] = None) -> List[Any]:
        items = self.find(query)
        seen = set()
        out = []
        for doc in items:
            val = doc.get(key)
            if val is not None and val not in seen:
                seen.add(val)
                out.append(val)
        return out

class LocalMongoStore:
    def __init__(self, filepath: str = LOCAL_STORE_PATH):
        self.filepath = filepath
        self.data: Dict[str, List[Dict[str, Any]]] = {}
        self._autosave_enabled = True
        self.load()

    def disable_autosave(self):
        self._autosave_enabled = False

    def enable_autosave(self, save_now: bool = True):
        self._autosave_enabled = True
        if save_now:
            self.save()

    def load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {}
        else:
            self.data = {}

    def save(self):
        if not self._autosave_enabled:
            return
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            print(f"[LocalMongoStore] Error saving: {e}")

    def __getitem__(self, name: str) -> LocalCollection:
        return LocalCollection(name, self)

    def get_collection(self, name: str) -> LocalCollection:
        return LocalCollection(name, self)

    def list_collection_names(self) -> List[str]:
        return list(self.data.keys())

    def drop_collection(self, name: str):
        if name in self.data:
            del self.data[name]
            self.save()

# Global database holder
_db_instance = None
_db_type = "unknown"

def init_db():
    global _db_instance, _db_type
    mongo_uri = Config.MONGODB_URI.strip() if Config.MONGODB_URI else ""

    if mongo_uri:
        try:
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            # Test connectivity
            client.admin.command('ping')
            _db_instance = client[Config.DB_NAME]
            _db_type = "mongodb"
            print(f"[Database] Connected to MongoDB Atlas/Instance at {mongo_uri}")
            return _db_instance
        except Exception as e:
            print(f"[Database] MongoDB URI provided but unreachable ({e}). Falling back to Local Embedded Storage.")

    _db_instance = LocalMongoStore()
    _db_type = "local_store"
    print("[Database] Initialized Local Embedded Storage (High-Fidelity Offline / Demo Store).")
    return _db_instance

def get_db():
    global _db_instance
    if _db_instance is None:
        init_db()
    return _db_instance

def get_storage_info() -> Dict[str, Any]:
    global _db_type
    if _db_instance is None:
        init_db()
    return {
        "engine": _db_type,
        "is_atlas": _db_type == "mongodb",
        "description": "MongoDB Atlas Cluster" if _db_type == "mongodb" else "Local Embedded Persistent JSON Store (Full Offline Demo Mode)",
        "demo_mode": Config.DEMO_MODE,
        "collections": get_db().list_collection_names()
    }
