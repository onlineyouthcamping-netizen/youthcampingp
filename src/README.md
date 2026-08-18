# Orphan directory — do not edit

This folder is **not** part of any build or deploy path.

It contains stray copies of admin components that belong in **`ycadmin/src/`**:

- `components/admin/AdminLayout.tsx`
- `components/admin/BookingDetailsView.tsx`

Root `tsconfig.json` only includes `tests/**/*`. No `package.json` script references this tree.

**For all admin UI work, use `ycadmin/`.**

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the live vs legacy inventory.
