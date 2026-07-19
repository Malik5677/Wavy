import re

with open('src/pages/OTP.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "if (!res.ok) {\n        const error = await res.json();\n        throw new Error(error.error || 'Failed to verify OTP');\n      }",
    "if (!res.ok) {\n        let errorMsg = 'Failed to verify OTP';\n        try {\n          const error = await res.json();\n          errorMsg = error.error || errorMsg;\n        } catch(e) {}\n        throw new Error(errorMsg);\n      }"
)

with open('src/pages/OTP.tsx', 'w') as f:
    f.write(content)
