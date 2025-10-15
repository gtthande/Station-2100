import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SyncOptions {
  dryRun: boolean;
  batchSize?: number;
}

export interface SyncResult {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
}

export interface SyncSummary {
  users: SyncResult;
  profiles: SyncResult;
  timestamp: string;
  dryRun: boolean;
}

/**
 * Test MySQL connection via Prisma
 */
export async function pingMySQL(): Promise<{ ok: boolean; details?: any; error?: string }> {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() AS version`;
    const version = result[0]?.version || 'Unknown';
    
    const tableCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'station'
    `;
    
    return {
      ok: true,
      details: {
        version,
        database: 'station',
        tables: Number(tableCount[0]?.count || 0),
        connection: 'active'
      }
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Sync users from Supabase to MySQL
 */
export async function syncUsers(
  supabase: any, 
  prisma: PrismaClient, 
  options: SyncOptions
): Promise<SyncResult> {
  const result: SyncResult = { total: 0, inserted: 0, updated: 0, errors: 0 };
  
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;
    
    result.total = users?.length || 0;
    
    if (!options.dryRun && users) {
      await prisma.$transaction(async (tx) => {
        for (const user of users) {
          try {
            const existing = await tx.user.findUnique({ where: { id: user.id } });
            if (!existing) {
              await tx.user.create({ 
                data: {
                  id: user.id,
                  email: user.email || '',
                  created_at: user.created_at ? new Date(user.created_at) : new Date(),
                  updated_at: new Date(),
                  email_confirmed_at: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
                  last_sign_in_at: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
                  raw_app_meta_data: user.raw_app_meta_data,
                  raw_user_meta_data: user.raw_user_meta_data,
                  is_super_admin: user.is_super_admin || false,
                  confirmation_token: user.confirmation_token,
                  recovery_token: user.recovery_token,
                  email_change_token: user.email_change_token,
                  email_change: user.email_change,
                  phone: user.phone,
                  phone_confirmed_at: user.phone_confirmed_at ? new Date(user.phone_confirmed_at) : null,
                  phone_change: user.phone_change,
                  phone_change_token: user.phone_change_token,
                  confirmed_at: user.confirmed_at ? new Date(user.confirmed_at) : null,
                  email_change_confirm_status: user.email_change_confirm_status || 0,
                  banned_until: user.banned_until ? new Date(user.banned_until) : null,
                  re_authentication_token: user.re_authentication_token,
                  re_authentication_sent_at: user.re_authentication_sent_at ? new Date(user.re_authentication_sent_at) : null,
                  is_sso_user: user.is_sso_user || false,
                  deleted_at: user.deleted_at ? new Date(user.deleted_at) : null,
                  is_anonymous: user.is_anonymous || false,
                  encrypted_password: user.encrypted_password,
                }
              });
              result.inserted++;
            } else {
              await tx.user.update({ 
                where: { id: user.id }, 
                data: {
                  email: user.email || existing.email,
                  updated_at: new Date(),
                  email_confirmed_at: user.email_confirmed_at ? new Date(user.email_confirmed_at) : existing.email_confirmed_at,
                  last_sign_in_at: user.last_sign_in_at ? new Date(user.last_sign_in_at) : existing.last_sign_in_at,
                  raw_app_meta_data: user.raw_app_meta_data || existing.raw_app_meta_data,
                  raw_user_meta_data: user.raw_user_meta_data || existing.raw_user_meta_data,
                  is_super_admin: user.is_super_admin !== undefined ? user.is_super_admin : existing.is_super_admin,
                  confirmation_token: user.confirmation_token || existing.confirmation_token,
                  recovery_token: user.recovery_token || existing.recovery_token,
                  email_change_token: user.email_change_token || existing.email_change_token,
                  email_change: user.email_change || existing.email_change,
                  phone: user.phone || existing.phone,
                  phone_confirmed_at: user.phone_confirmed_at ? new Date(user.phone_confirmed_at) : existing.phone_confirmed_at,
                  phone_change: user.phone_change || existing.phone_change,
                  phone_change_token: user.phone_change_token || existing.phone_change_token,
                  confirmed_at: user.confirmed_at ? new Date(user.confirmed_at) : existing.confirmed_at,
                  email_change_confirm_status: user.email_change_confirm_status !== undefined ? user.email_change_confirm_status : existing.email_change_confirm_status,
                  banned_until: user.banned_until ? new Date(user.banned_until) : existing.banned_until,
                  re_authentication_token: user.re_authentication_token || existing.re_authentication_token,
                  re_authentication_sent_at: user.re_authentication_sent_at ? new Date(user.re_authentication_sent_at) : existing.re_authentication_sent_at,
                  is_sso_user: user.is_sso_user !== undefined ? user.is_sso_user : existing.is_sso_user,
                  deleted_at: user.deleted_at ? new Date(user.deleted_at) : existing.deleted_at,
                  is_anonymous: user.is_anonymous !== undefined ? user.is_anonymous : existing.is_anonymous,
                  encrypted_password: user.encrypted_password || existing.encrypted_password,
                }
              });
              result.updated++;
            }
          } catch (error) {
            console.error(`Error syncing user ${user.id}:`, error);
            result.errors++;
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Error in syncUsers:', error);
    result.errors++;
  }
  
  return result;
}

/**
 * Sync profiles from Supabase to MySQL
 */
export async function syncProfiles(
  supabase: any, 
  prisma: PrismaClient, 
  options: SyncOptions
): Promise<SyncResult> {
  const result: SyncResult = { total: 0, inserted: 0, updated: 0, errors: 0 };
  
  try {
    const { data: profiles, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    
    result.total = profiles?.length || 0;
    
    if (!options.dryRun && profiles) {
      await prisma.$transaction(async (tx) => {
        for (const profile of profiles) {
          try {
            const existing = await tx.profile.findUnique({ where: { id: profile.id } });
            if (!existing) {
              await tx.profile.create({ 
                data: {
                  id: profile.id,
                  user_id: profile.user_id || '',
                  email: profile.email || '',
                  full_name: profile.full_name,
                  position: profile.position,
                  department_id: profile.department_id,
                  is_staff: profile.is_staff || false,
                  staff_active: profile.staff_active !== undefined ? profile.staff_active : true,
                  phone: profile.phone,
                  badge_id: profile.badge_id,
                  profile_image_url: profile.profile_image_url,
                  bio: profile.bio,
                  created_at: profile.created_at ? new Date(profile.created_at) : new Date(),
                  updated_at: new Date(),
                }
              });
              result.inserted++;
            } else {
              await tx.profile.update({ 
                where: { id: profile.id }, 
                data: {
                  user_id: profile.user_id || existing.user_id,
                  email: profile.email || existing.email,
                  full_name: profile.full_name || existing.full_name,
                  position: profile.position || existing.position,
                  department_id: profile.department_id || existing.department_id,
                  is_staff: profile.is_staff !== undefined ? profile.is_staff : existing.is_staff,
                  staff_active: profile.staff_active !== undefined ? profile.staff_active : existing.staff_active,
                  phone: profile.phone || existing.phone,
                  badge_id: profile.badge_id || existing.badge_id,
                  profile_image_url: profile.profile_image_url || existing.profile_image_url,
                  bio: profile.bio || existing.bio,
                  updated_at: new Date(),
                }
              });
              result.updated++;
            }
          } catch (error) {
            console.error(`Error syncing profile ${profile.id}:`, error);
            result.errors++;
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Error in syncProfiles:', error);
    result.errors++;
  }
  
  return result;
}

/**
 * Run full sync from Supabase to MySQL
 */
export async function runFullSync(options: SyncOptions): Promise<SyncSummary> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const users = await syncUsers(supabase, prisma, options);
  const profiles = await syncProfiles(supabase, prisma, options);

  return {
    users,
    profiles,
    timestamp: new Date().toISOString(),
    dryRun: options.dryRun
  };
}
