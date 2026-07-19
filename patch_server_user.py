with open('src/server/user.ts', 'r') as f:
    content = f.read()

imports = "import { contacts } from '../db/schema';\nimport { and } from 'drizzle-orm';"

if "import { contacts" not in content:
    content = content.replace("import { eq } from 'drizzle-orm';", "import { eq, and } from 'drizzle-orm';\nimport { contacts } from '../db/schema';")

contacts_routes = """
userRouter.get('/contacts', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userContacts = await db.select().from(contacts).where(eq(contacts.userId, userId));
    res.json(userContacts);
  } catch (error) {
    console.error('Error fetching contacts', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

userRouter.post('/contacts', authenticate, async (req, res) => {
  try {
    const { contactId, customName } = req.body;
    const userId = req.user.id;
    
    const existing = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.contactId, contactId))).limit(1).then(r => r[0]);
    
    if (existing) {
      await db.update(contacts).set({ customName }).where(eq(contacts.id, existing.id));
    } else {
      await db.insert(contacts).values({ userId, contactId, customName });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving contact', error);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});
"""

if "/contacts" not in content:
    content += contacts_routes

with open('src/server/user.ts', 'w') as f:
    f.write(content)
print("Patched server user routes")
