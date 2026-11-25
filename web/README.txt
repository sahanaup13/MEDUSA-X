MEDUSA-X landing-page integration patch

Copy the three files in this archive into:
D:\MEDUSA-X\web\src\

Files:
- Landing.jsx: new React landing page with a real Three.js animated medical intelligence core.
- Landing.css: complete landing-page styling, responsive rules, entrance animations, and Three.js canvas styling.
- App.jsx: your existing App.jsx with the invalid CSS block accidentally appended after `export default App;` removed. Existing dashboard logic and API calls are otherwise preserved.

No backend files or database are included or changed.
Three.js and lucide-react are already listed in the supplied package.json.

After copying, from PowerShell:
  cd D:\MEDUSA-X\web
  npm run dev

Open:
  http://localhost:5175/

To verify a production build:
  npm run build
