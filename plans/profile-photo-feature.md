# Profile Photo Feature - Implementation Plan

## Current State
- ✅ `avatar_url` field exists in `profiles` table
- ✅ Tutor profile page has photo upload
- ✅ Parent profile page has photo upload
- ✅ Storage bucket `profile-avatars` exists
- ❌ Avatars not displayed in session lists, dashboards, etc.

## Goal
All users can upload profile photos and see each other's photos.

## Architecture

### Components Needed

1. **Reusable Avatar Component** (`components/ui/Avatar.tsx`)
   - Props: `src`, `alt`, `size`, `fallback` (initials)
   - Shows image or initials fallback
   - Rounded full / circular
   - Sizes: sm, md, lg, xl

2. **Avatar Upload Component** (`components/ui/AvatarUpload.tsx`)
   - For profile pages
   - Shows current photo
   - Upload button
   - Loading state during upload

### Places to Add Avatars

1. **Session Cards** (tutor ↔ parent interaction)
   - `app/(dashboard)/tentor/sesi/page.tsx` - Show parent avatar
   - `app/(dashboard)/ortu/jadwal/page.tsx` - Show tutor avatar

2. **Dashboard Widgets**
   - `app/(dashboard)/tentor/page.tsx` - Show welcome with avatar
   - `app/(dashboard)/ortu/page.tsx` - Show welcome with avatar

3. **Sidebar Headers**
   - All sidebar components - show user avatar

4. **Student Cards (optional)**
   - Admin student list

### Files to Modify

```
components/ui/Avatar.tsx (new)
components/ui/AvatarUpload.tsx (new)
app/(dashboard)/tentor/sesi/page.tsx
app/(dashboard)/ortu/jadwal/page.tsx
app/(dashboard)/tentor/page.tsx
app/(dashboard)/ortu/page.tsx
components/tentor/TentorSidebar.tsx
components/ortu/OrtuSidebar.tsx
components/admin/Sidebar.tsx
```

### Implementation Steps

1. Create Avatar component
2. Create AvatarUpload component  
3. Add to sidebar headers
4. Add to session cards
5. Add to dashboards

### Supabase Storage Setup

Bucket: `profile-avatars` (public)
RLS: Read - authenticated users
     Write - own profile only
