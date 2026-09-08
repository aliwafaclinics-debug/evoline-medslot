# How to Push Your Code to GitHub

## Step 1: Install Git

### On Windows:
1. Download from: https://git-scm.com/download/win
2. Run the installer
3. Accept default settings and click "Install"
4. Restart your computer (or PowerShell)

### Verify installation:
```powershell
git --version
```

---

## Step 2: Configure Git (One-time setup)

After installing Git, open PowerShell and run:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Replace with your actual name and email.

---

## Step 3: Create a GitHub Repository

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name:** `evoline-medslot`
   - **Description:** "Medical clinic appointment booking & investment platform"
   - **Public** or **Private** (your choice)
   - Leave other options as default
3. Click **"Create repository"**

**Copy the HTTPS URL** that appears (looks like: `https://github.com/YOUR-USERNAME/evoline-medslot.git`)

---

## Step 4: Push Your Code to GitHub

Open PowerShell and navigate to your project:

```powershell
cd "C:\Users\Nahhas\Downloads\evoline-medslot-complete (1)\01-source-code"
```

### Initialize Git and push code:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Evoline MedSlot platform"

# Add GitHub as remote (replace URL with your repo URL)
git remote add origin https://github.com/YOUR-USERNAME/evoline-medslot.git

# Push to GitHub (this will ask for your GitHub credentials)
git branch -M main
git push -u origin main
```

### When prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your password!)

#### How to create a Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name: "Deploy Token"
4. Check these permissions:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (GitHub Actions)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password in PowerShell

---

## Step 5: Verify Push Was Successful

1. Go to your GitHub repo: `https://github.com/YOUR-USERNAME/evoline-medslot`
2. You should see all your files there
3. The code is now ready for Vercel and Railway!

---

## Complete PowerShell Script (All-in-One)

If you want to do it all at once, save this as `push-to-github.ps1`:

```powershell
# Configuration
$GITHUB_USERNAME = "YOUR-USERNAME"  # Replace with your GitHub username
$REPO_NAME = "evoline-medslot"
$PROJECT_DIR = "C:\Users\Nahhas\Downloads\evoline-medslot-complete (1)\01-source-code"

Write-Host "Pushing code to GitHub..." -ForegroundColor Green

# Navigate to project
cd $PROJECT_DIR

# Initialize git
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: Evoline MedSlot - Medical clinic booking & investment platform"

# Add remote
$GITHUB_URL = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git remote add origin $GITHUB_URL

# Push
git branch -M main
git push -u origin main

Write-Host "`n✅ Code pushed to: $GITHUB_URL" -ForegroundColor Green
```

Run it:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\push-to-github.ps1
```

---

## Troubleshooting

### "fatal: not a git repository"
→ Make sure you're in the correct directory: `C:\Users\Nahhas\Downloads\evoline-medslot-complete (1)\01-source-code`

### "Permission denied" or "Authentication failed"
→ Use a Personal Access Token instead of your password (see Step 4)

### "remote origin already exists"
→ Run: `git remote remove origin` then try again

### "fatal: could not read Username"
→ Make sure you've configured git globally (see Step 2)

---

## Next Steps After Pushing

Once your code is on GitHub:
1. Vercel can deploy your frontend automatically
2. Railway can deploy your backend automatically
3. Both platforms watch your repo for changes and auto-deploy!

---

**Questions? Let me know!** 🚀
