

## 📝 Planning Phase  
- **Clarify Scope**: Define goals and acceptance criteria up front to prevent scope creep 
- **Decompose Work**: Break the request into subtasks (e.g., UI, API, state) and list them 
- **Document & Track**: Create a simple checklist with subtask descriptions and dependencies 

---

## 💻 Coding Phase  
- **Modular & DRY**: Write small, single‑responsibility functions/components   
- **Enforce Standards**: Use code reviews and linters (Prettier/ESLint) to catch style and error patterns 
- **Logging Strategy**:  
  - `console.log()` for high‑level flow  
  - `console.info()` for significant events  
  - `console.debug()` for variable dumps   
- **Graceful Errors**: Wrap risky calls in `try/catch`, throwing contextual errors when needed  
- **Test Early**: Write unit tests alongside code (TDD or test‑first) to validate logic before integration   

---

## 🐞 Debugging Phase  
- **Trace & Inspect**: Use logs, breakpoints, and the debugger to follow execution paths .
- **Hypothesize & Validate**: Gather error messages and logs, list potential causes, then test each with targeted logs or assertions  


---

