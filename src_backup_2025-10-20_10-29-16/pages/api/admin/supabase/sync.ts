import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Optional token-based protection
  const token = process.env.SYNC_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const dryRun = req.query.dryRun === "true";

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      requireEnv("VITE_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    console.log(`Starting Supabase sync (dryRun: ${dryRun})`);

    // Sync Users
    const usersResp = await supabase.from("users").select("*");
    if (usersResp.error) throw new Error(`Users fetch failed: ${usersResp.error.message}`);
    const users = usersResp.data || [];

    let usersInserted = 0, usersUpdated = 0;

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        for (const u of users) {
          const existing = await tx.user.findUnique({ where: { id: u.id } });
          if (!existing) {
            await tx.user.create({ 
              data: {
                id: u.id,
                email: u.email || '',
                created_at: u.created_at ? new Date(u.created_at) : new Date(),
                updated_at: new Date(),
                email_confirmed_at: u.email_confirmed_at ? new Date(u.email_confirmed_at) : null,
                last_sign_in_at: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null,
                raw_app_meta_data: u.raw_app_meta_data,
                raw_user_meta_data: u.raw_user_meta_data,
                is_super_admin: u.is_super_admin || false,
                confirmation_token: u.confirmation_token,
                recovery_token: u.recovery_token,
                email_change_token: u.email_change_token,
                email_change: u.email_change,
                phone: u.phone,
                phone_confirmed_at: u.phone_confirmed_at ? new Date(u.phone_confirmed_at) : null,
                phone_change: u.phone_change,
                phone_change_token: u.phone_change_token,
                confirmed_at: u.confirmed_at ? new Date(u.confirmed_at) : null,
                email_change_confirm_status: u.email_change_confirm_status || 0,
                banned_until: u.banned_until ? new Date(u.banned_until) : null,
                re_authentication_token: u.re_authentication_token,
                re_authentication_sent_at: u.re_authentication_sent_at ? new Date(u.re_authentication_sent_at) : null,
                is_sso_user: u.is_sso_user || false,
                deleted_at: u.deleted_at ? new Date(u.deleted_at) : null,
                is_anonymous: u.is_anonymous || false,
                encrypted_password: u.encrypted_password,
              }
            });
            usersInserted++;
          } else {
            await tx.user.update({ 
              where: { id: u.id }, 
              data: {
                email: u.email || existing.email,
                updated_at: new Date(),
                email_confirmed_at: u.email_confirmed_at ? new Date(u.email_confirmed_at) : existing.email_confirmed_at,
                last_sign_in_at: u.last_sign_in_at ? new Date(u.last_sign_in_at) : existing.last_sign_in_at,
                raw_app_meta_data: u.raw_app_meta_data || existing.raw_app_meta_data,
                raw_user_meta_data: u.raw_user_meta_data || existing.raw_user_meta_data,
                is_super_admin: u.is_super_admin !== undefined ? u.is_super_admin : existing.is_super_admin,
                confirmation_token: u.confirmation_token || existing.confirmation_token,
                recovery_token: u.recovery_token || existing.recovery_token,
                email_change_token: u.email_change_token || existing.email_change_token,
                email_change: u.email_change || existing.email_change,
                phone: u.phone || existing.phone,
                phone_confirmed_at: u.phone_confirmed_at ? new Date(u.phone_confirmed_at) : existing.phone_confirmed_at,
                phone_change: u.phone_change || existing.phone_change,
                phone_change_token: u.phone_change_token || existing.phone_change_token,
                confirmed_at: u.confirmed_at ? new Date(u.confirmed_at) : existing.confirmed_at,
                email_change_confirm_status: u.email_change_confirm_status !== undefined ? u.email_change_confirm_status : existing.email_change_confirm_status,
                banned_until: u.banned_until ? new Date(u.banned_until) : existing.banned_until,
                re_authentication_token: u.re_authentication_token || existing.re_authentication_token,
                re_authentication_sent_at: u.re_authentication_sent_at ? new Date(u.re_authentication_sent_at) : existing.re_authentication_sent_at,
                is_sso_user: u.is_sso_user !== undefined ? u.is_sso_user : existing.is_sso_user,
                deleted_at: u.deleted_at ? new Date(u.deleted_at) : existing.deleted_at,
                is_anonymous: u.is_anonymous !== undefined ? u.is_anonymous : existing.is_anonymous,
                encrypted_password: u.encrypted_password || existing.encrypted_password,
              }
            });
            usersUpdated++;
          }
        }
      });
    }

    // Sync Profiles
    const profilesResp = await supabase.from("profiles").select("*");
    if (profilesResp.error) throw new Error(`Profiles fetch failed: ${profilesResp.error.message}`);
    const profiles = profilesResp.data || [];

    let profilesInserted = 0, profilesUpdated = 0;

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        for (const p of profiles) {
          const existing = await tx.profile.findUnique({ where: { id: p.id } });
          if (!existing) {
            await tx.profile.create({ 
              data: {
                id: p.id,
                user_id: p.user_id || '',
                email: p.email || '',
                full_name: p.full_name,
                position: p.position,
                department_id: p.department_id,
                is_staff: p.is_staff || false,
                staff_active: p.staff_active !== undefined ? p.staff_active : true,
                phone: p.phone,
                badge_id: p.badge_id,
                profile_image_url: p.profile_image_url,
                bio: p.bio,
                created_at: p.created_at ? new Date(p.created_at) : new Date(),
                updated_at: new Date(),
              }
            });
            profilesInserted++;
          } else {
            await tx.profile.update({ 
              where: { id: p.id }, 
              data: {
                user_id: p.user_id || existing.user_id,
                email: p.email || existing.email,
                full_name: p.full_name || existing.full_name,
                position: p.position || existing.position,
                department_id: p.department_id || existing.department_id,
                is_staff: p.is_staff !== undefined ? p.is_staff : existing.is_staff,
                staff_active: p.staff_active !== undefined ? p.staff_active : existing.staff_active,
                phone: p.phone || existing.phone,
                badge_id: p.badge_id || existing.badge_id,
                profile_image_url: p.profile_image_url || existing.profile_image_url,
                bio: p.bio || existing.bio,
                updated_at: new Date(),
              }
            });
            profilesUpdated++;
          }
        }
      });
    }

    const summary = {
      ok: true,
      dryRun,
      timestamp: new Date().toISOString(),
      users: { 
        total: users.length, 
        inserted: usersInserted, 
        updated: usersUpdated 
      },
      profiles: { 
        total: profiles.length, 
        inserted: profilesInserted, 
        updated: profilesUpdated 
      },
    };

    console.log('Supabase sync completed:', summary);
    res.json(summary);

  } catch (err: any) {
    console.error('Supabase sync error:', err);
    res.status(500).json({ 
      ok: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
