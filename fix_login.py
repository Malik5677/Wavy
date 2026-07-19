import re

with open('src/pages/Login.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "if (!res.ok) throw new Error('Failed to send OTP');\n      const data = await res.json();",
    "if (!res.ok) {\n        let errorMsg = 'Failed to send OTP';\n        try {\n          const error = await res.json();\n          errorMsg = error.error || errorMsg;\n        } catch(e) {}\n        throw new Error(errorMsg);\n      }\n      const data = await res.json();"
)

with open('src/pages/Login.tsx', 'w') as f:
    f.write(content)
