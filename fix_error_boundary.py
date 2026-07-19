import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import Home from './pages/Home';",
    "import Home from './pages/Home';\nimport { ErrorBoundary } from './components/ErrorBoundary';"
)

content = content.replace(
    "<BrowserRouter>",
    "<BrowserRouter>\n        <ErrorBoundary>"
)

content = content.replace(
    "</BrowserRouter>",
    "        </ErrorBoundary>\n      </BrowserRouter>"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
