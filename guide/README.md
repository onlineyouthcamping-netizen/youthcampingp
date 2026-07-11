# YouthCamping Guide Reporting

A production-ready MVP application for YouthCamping guides to check-in/check-out with GPS, selfie verification, and notes, and for admins to monitor attendance logs and approve payments.

## Tech Stack
* **Monorepo**: pnpm workspaces
* **Frontend**: Expo React Native (iOS & Android)
* **Backend**: Express API server (Node.js & TypeScript)
* **Database**: PostgreSQL with Drizzle ORM
* **Cloud Storage**: Cloudinary (for production selfie uploads)

---

## Environment Configuration

Create a `.env` file in the root workspace (copied from `.env.example`):

```env
# Database connection string (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# API Server Port
PORT=5000

# Cloudinary Credentials (Production Only)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Build Instructions

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```
2. **Apply Database Migrations**:
   ```bash
   pnpm --filter @workspace/db run push
   ```
3. **Seed Database**:
   ```bash
   pnpm --filter @workspace/db run seed
   ```
4. **Build the Monorepo**:
   ```bash
   pnpm run build
   ```
5. **Run Backend Server (Dev)**:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```
6. **Run Mobile Client (Dev)**:
   ```bash
   pnpm --filter @workspace/mobile run dev
   ```

---

## EAS Build Instructions (Android APK)

To build the Android app standalone APK using Expo Application Services (EAS):

1. **Install EAS CLI** (if not installed):
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo Account**:
   ```bash
   eas login
   ```
3. **Configure Project for EAS**:
   ```bash
   cd artifacts/mobile
   eas project:init
   ```
4. **Trigger Preview Build**:
   ```bash
   eas build --platform android --profile preview
   ```
   *This profile compiles the app down to an installable standalone Android `.apk` file.*

---

## Deployment Checklist

- [ ] **Database Connection**: Set `DATABASE_URL` pointing to the production PostgreSQL instance.
- [ ] **API Endpoint**: Verify `API_BASE_URL` in mobile `constants/config.ts` points to the production server.
- [ ] **Selfie Storage**: Ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are correctly configured in production environment variables.
- [ ] **EAS Build Credentials**: Ensure Expo configuration has proper signing keys for android/ios.
- [ ] **Admin Account**: Verify default admin access token / phone number is secured in database.
