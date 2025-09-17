# Station-2100 Architecture

This document will hold system architecture details for Station-2100. It is structured into sections so future contributors can expand it with diagrams and technical notes.

---

## 1. Entity Relationship Diagram (ERD)

### Sample ERD (text-based, placeholder)

| Table        | Fields                                                                 |
|--------------|------------------------------------------------------------------------|
| Users        | id (PK), name, email, role, created_at                                 |
| Customers    | id (PK), name, contact_info, created_at                                |
| Suppliers    | id (PK), name, contact_info, created_at                                |
| Inventory    | id (PK), item_name, batch_no, expiry_date, quantity, supplier_id (FK)  |
| JobCards     | id (PK), description, status, assigned_to (FK Users), created_at       |
| Transactions | id (PK), type, item_id (FK Inventory), qty, customer_id (FK), date     |

Relationships:
- One Supplier → Many Inventory items
- One Customer → Many Transactions
- One JobCard → Assigned to One User
- Inventory linked to Transactions

(Replace this table with a proper diagram later. Store diagrams in `/docs/architecture/`.)

---

## 2. Component Diagram
(Placeholder)  
- System components:  
  - Frontend: Next.js 14 + Tailwind  
  - Backend: Node.js + Supabase (Auth, DB, Storage)  
  - Scripts: PowerShell helpers for dev/CI  
  - Integrations: GitHub, Vercel/Hostinger  
- To be drawn as UML diagram and stored in `/docs/architecture/`.

---

## 3. Deployment Diagram
(Placeholder)  
- Local dev environment: Vite + Supabase CLI + Node.js  
- Production: Vercel frontend + Supabase backend + MySQL (if applicable)  
- Optional: Hostinger deployment scenario  
- Deployment diagram should show servers, services, and flows. Store in `/docs/architecture/`.

---

## Notes
- Keep ERD, component diagrams, and deployment diagrams updated as the project evolves.  
- All diagrams should live in `/docs/architecture/` as `.png` or `.svg` (and `.drawio` if using diagrams.net).  
- Prefer open formats for version control.