import re
with open('src/db/schema.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "isDeleted: boolean('is_deleted').default(false).notNull(),",
    "isDeleted: boolean('is_deleted').default(false).notNull(),\n  isHidden: boolean('is_hidden').default(false).notNull(),"
)
with open('src/db/schema.ts', 'w') as f:
    f.write(content)
print("Schema patched")
