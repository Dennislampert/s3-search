# S3-search

*S3 compatible search engin with a touch of elastic-search*

`type`/`index`/`_search`\
Or as in the code \
`localhost:xxxx/NODE_ENV`+/`path`/`file`/`_action` \
Example:
```https://localhost:1989/kopinget/payments``` to get all in one `index` or called `file` on s3


***S3-search ONLY SUPPORT POST REQUEST***

Bucket is set as envirment variable. Not configurable in the path due to security \
and upcomming sever cache memory reasons.

• Event based db layer \
• Server cahce \
• 5Gb data per index \
• Fast \
• A touch of Elastic-search


### _search

##### Query functions:
- "filter": \
e.g: `{ "filter": {"currency": {"must": "kr" }}`
- "all": 
e.g: `{"all": {}}`
- "fields"
e.g `{"fields": ["field", "fields", ...]`
If it founds one of the fields, it will return the document with the only field. \
If it dont find any field it will not turn the doc. \

##### Query filter options:
- "must": `strict` (int, string, bool) Case sensetive
- "must_not": `strict` (int, string, bool) Case sensetive
- "must_contain" `array [string, int, bool]` (search document as string) searching as `AND`
- "must_not_contain" `array [string, int, bool]` (search document as string) searching as `AND`
- "gte": `strict` (int)
- "gt": `strict` (int)
- "lte": `strict` (int)
- "lt": `strict` (int)

### _delete
Delete specified field's in document: \
```/kopinget/payment/_delete -d '{"_id": "4x3614967781670394xty", "fields": ["payments", "currency"] }'```

Delete a whole document: \
```/kopinget/payment/_delete -d '{"_id": "4x3614967781670394xty"}'```

### _insert
Insert instanciates a object with the query data \
if new field is added after insert to the document, use `_update` the document with the new fields/data) \
```/kopinget/payment/_insert -d '{"user": "Lillen","age": 33,"payments": [2],"currency": "kr"}'```

### _update
Updedate can update fields, or add fields to a document. *It does whay you say*. \
The example below will update a document with the _id 4x3614967781670394xty, and \
change or update the field payments depending if it exist or not. \
If payments exist it will owerride the fields value.
It's not possibel to add an item to the array without passing in the complete array. \
```/kopinget/payment/_update -d '{"_id": "4x3614967781670394xty", "payments": [22, 23] }'```

##### Examples:
- filter:\
```curl -X POST -H "Content-Type: application/json" 'localhost:8080/kopinget/payment/_search' -d '{ "filter": {"currency": {"must": "kr" }}}'```

### Configure:
its all in the environment variables: \
**`NODE_ENV`** if you follow S3-search standard path on s3 default development \
**`BUCKET`** default undefined name of the boucket you want to connect S3-search to (required) \
**`BACKUP_EVERY_X_H`** how often you'll like a backup of the latest data. \
(1 = every hour, 2 = every second hour etc..) \
Bakup is taken if data has changes since the last uppdate. default 1 \
**`SERVER_PORT`** default 1989
**`SERVER_IP`** default undefined \
**`NODE_ENV`** default development \
**`AWS_ACCESS_KEY_ID`** default undefined (required) \
**`AWS_SECRET_ACCESS_KEY`** default undefined (required) \
**`AWS_DEFAULT_REGION`** default undefined (required) \



**TODO**:
> **[√]** Support _UPDATE \
> **[√]** Cache write state \
> **[√]** Event queue \
> **[√]** Query fields function \
> **[√]** Backup time function \
> **[ ]** Support for deepsearch in array (one level) \
> **[ ]** Support for deepsearch in obejct (one level) ? \
> **[ ]** Add tests
