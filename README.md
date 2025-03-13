### **Branch Naming Convention**

To maintain a structured and organized workflow, we follow this branch naming convention:

```
{pageOrScope}-{branchType}-{version}
```

#### **1. Page or Scope**
Indicates the specific part of the app the branch affects.

- `welcome`
- `signUp`
- `logIn`
- `dataCollection`
- `dashboard`
- `onboarding`
- `global` (for changes affecting multiple areas)

#### **2. Branch Type**
Describes the purpose of the branch.

- **`feature`** → New feature development  
- **`bugfix`** → Fixing bugs  
- **`refactor`** → Code improvements (e.g., optimizing logic, cleaning up code)  
- **`chore`** → Non-functional updates (e.g., configs, dependencies, documentation)  
- **`uiux`** → UI/UX improvements (e.g., styling, responsiveness, layout updates)  
- **`dbsetup`** → Database setup and configuration  
- **`llm`** → Enhancing the LLM for better AI-driven analytics  
- **`authentication`** → Setup Authentication   

#### **3. Version**
Each branch should have a version number for tracking purposes, starting from `0.1` and incrementing with each iteration.

---

### **Examples**
- **New feature for onboarding stepper (first version):**  
  ```
  onboarding-feature-0.1
  ```
- **Bug fix for login validation (second iteration):**  
  ```
  logIn-bugfix-0.2
  ```
- **Refactoring data collection form logic (first version):**  
  ```
  dataCollection-refactor-0.1
  ```
- **UI/UX improvement for the dashboard layout (third iteration):**  
  ```
  dashboard-uiux-0.3
  ```
- **Chore: Updating README documentation (first version):**  
  ```
  global-chore-0.1
  ```
- **Database setup for analytics storage (first version):**  
  ```
  global-dbsetup-0.1
  ```
- **Enhancing LLM for improved AI analytics (second version):**  
  ```
  global-llmEnhancement-0.2
  ```

---

### **Branch Versioning Guidelines**
- Start with `0.1` for new branches.
- Increment by `0.1` for each update or revision.
- Keep versioning consistent to track progress effectively.

By following this convention, we ensure clarity, maintainability, and better collaboration within the team. 🚀

