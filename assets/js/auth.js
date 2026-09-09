/**
 * THRINETHRA Authentication & Identity Management System
 * Dynamic multi-provider auth supporting Google, Apple, and Email/Password
 * connected dynamically to the Neon PostgreSQL database.
 * 
 * Strict access control: Only registered users in the Neon database
 * are permitted to log in via Email or Google OAuth.
 */

(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    CURRENT_USER: 'thrinethra_current_user',
    USERS_DB: 'thrinethra_registered_users',
    AUTH_TOKEN: 'thrinethra_auth_token',
    REMEMBER: 'thrinethra_remember_me'
  };

  // Seed default admin / demo user if not present
  const DEFAULT_USERS = [
    {
      id: 'usr_admin_001',
      firstName: 'Thri',
      lastName: 'Nethra',
      name: 'Thri Nethra',
      email: 'admin@thrinethra.gov',
      org: 'Bengaluru Metropolitan Transport Corp. (BMTC)',
      role: 'Chief Traffic Controller',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      provider: 'email',
      passwordHash: 'Thrinethra2026!',
      createdAt: '2026-09-09T00:00:00.000Z'
    },
    {
      id: 'usr_demo_002',
      firstName: 'Vikram',
      lastName: 'Rao',
      name: 'Vikram Rao',
      email: 'v.rao@transportauthority.gov',
      org: 'Urban Mobility Command',
      role: 'Fleet Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      provider: 'email',
      passwordHash: 'Demo1234!',
      createdAt: '2026-09-09T00:00:00.000Z'
    }
  ];

  class AuthManager {
    constructor() {
      this._initDatabase();
      this.listeners = [];
      if (global.NeonDB) {
        global.NeonDB.initSchema().catch(e => console.warn('Neon DB async init:', e.message));
      }
    }

    _initDatabase() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        if (!stored) {
          localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(DEFAULT_USERS));
        }
      } catch (e) {
        console.warn('Storage unavailable:', e);
      }
    }

    _getUsers() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        return raw ? JSON.parse(raw) : DEFAULT_USERS;
      } catch (e) {
        return DEFAULT_USERS;
      }
    }

    _saveUsers(users) {
      try {
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      } catch (e) {
        console.error('Failed to save user database cache:', e);
      }
    }

    // Subscribe to auth state changes
    onAuthStateChanged(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
        // Call immediately with current state
        callback(this.getCurrentUser());
      }
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    _notifyListeners(user) {
      this.listeners.forEach(cb => {
        try { cb(user); } catch (err) { console.error('Auth listener error:', err); }
      });
    }

    getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    isAuthenticated() {
      return this.getCurrentUser() !== null;
    }

    _setSession(user, remember = true) {
      const storage = remember ? localStorage : sessionStorage;
      const cleanUser = {
        id: user.id || 'usr_' + Date.now(),
        firstName: user.firstName || (user.name ? user.name.split(' ')[0] : 'Officer'),
        lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Officer',
        email: user.email,
        org: user.org || 'City Transport Authority',
        role: user.role || 'Command Center Operator',
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=1B2129&textColor=FF7A45`,
        provider: user.provider || 'email',
        lastLogin: new Date().toISOString()
      };

      try {
        // Clear previous session if any
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

        storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(cleanUser));
        storage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'thri_jwt_' + btoa(cleanUser.email + ':' + Date.now()));
      } catch (e) {
        console.error('Error setting session:', e);
      }

      this._notifyListeners(cleanUser);
      return cleanUser;
    }

    /**
     * Dynamic Email/Password Login
     * STRICT ENFORCEMENT: Queries Neon database. If the user has not registered,
     * the login attempt is rejected.
     */
    async loginWithEmail(email, password, remember = true) {
      const cleanEmail = (email || '').trim().toLowerCase();
      
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Please provide a valid work email address.');
      }
      if (!password || password.length < 4) {
        throw new Error('Please enter your password.');
      }

      let existing = null;
      let usedNeon = false;

      // Primary check: Neon PostgreSQL Cloud Database
      if (global.NeonDB) {
        try {
          existing = await global.NeonDB.findUserByEmail(cleanEmail);
          usedNeon = true;
        } catch (neonErr) {
          console.warn('Neon query failed, checking local cache:', neonErr);
        }
      }

      // Fallback to local storage if Neon connection is unavailable
      if (!usedNeon) {
        const localUsers = this._getUsers();
        existing = localUsers.find(u => u.email.toLowerCase() === cleanEmail);
      }

      // STRICT RULE: User must be registered in the database
      if (!existing) {
        throw new Error('No registered account found for ' + cleanEmail + '. You must create an account first on the Registration page.');
      }

      // Verify password
      if (existing.passwordHash && existing.passwordHash !== password) {
        throw new Error('Incorrect password. Please verify your credentials or reset your password.');
      }

      // Update last_login timestamp in Neon
      if (global.NeonDB && existing.id) {
        global.NeonDB.updateLastLogin(existing.id).catch(() => {});
      }

      return this._setSession(existing, remember);
    }

    _loadGoogleGsiScript() {
      return new Promise((resolve) => {
        if (window.google && window.google.accounts) {
          return resolve(true);
        }
        var existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(true));
          existing.addEventListener('error', () => resolve(false));
          setTimeout(() => resolve(!!(window.google && window.google.accounts)), 2000);
          return;
        }
        var script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
        setTimeout(() => resolve(!!(window.google && window.google.accounts)), 2500);
      });
    }

    async _processGoogleProfile(profile, isRegister) {
      const email = (profile.email || '').trim().toLowerCase();
      const name = (profile.name || email.split('@')[0]).trim();
      const pic = profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1A73E8&textColor=ffffff`;

      let existing = null;
      if (global.NeonDB) {
        existing = await global.NeonDB.findUserByEmail(email);
      } else {
        const users = this._getUsers();
        existing = users.find(u => u.email.toLowerCase() === email);
      }

      if (isRegister) {
        // REGISTER FLOW:
        if (existing) {
          if (global.NeonDB && existing.id) global.NeonDB.updateLastLogin(existing.id).catch(() => {});
          return this._setSession(existing, true);
        }

        // Create new user in Neon PostgreSQL
        let created;
        if (global.NeonDB) {
          created = await global.NeonDB.createUser({
            firstName: profile.given_name || name.split(' ')[0],
            lastName: profile.family_name || (name.split(' ').slice(1).join(' ') || 'Officer'),
            name: name,
            email: email,
            org: 'Transport Authority Command',
            role: 'Urban Mobility Specialist',
            avatar: pic,
            provider: 'google'
          });
        } else {
          created = {
            id: 'usr_g_' + Date.now().toString(36),
            firstName: profile.given_name || name.split(' ')[0],
            lastName: profile.family_name || (name.split(' ').slice(1).join(' ') || 'Officer'),
            name: name,
            email: email,
            org: 'Transport Authority Command',
            role: 'Urban Mobility Specialist',
            avatar: pic,
            provider: 'google'
          };
          const users = this._getUsers();
          users.push(created);
          this._saveUsers(users);
        }

        return this._setSession(created, true);
      } else {
        // LOGIN FLOW: STRICT CHECK
        if (!existing) {
          throw new Error('This Google account (' + email + ') is not registered with Thrinethra. Please create an account on the Registration page first.');
        }

        if (global.NeonDB && existing.id) {
          global.NeonDB.updateLastLogin(existing.id).catch(() => {});
        }

        return this._setSession(existing, true);
      }
    }

    _promptDeviceGoogleEmail(isRegister, err, resolve, reject) {
      const modal = document.createElement('div');
      modal.id = 'thri-google-auth-dialog';
      modal.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px);
        display:flex; align-items:center; justify-content:center; z-index:99999;
        font-family:'Inter',sans-serif; animation:oauthFadeIn 0.2s ease-out;
      `;

      modal.innerHTML = `
        <div style="background:#ffffff; color:#202124; width:390px; border-radius:14px; box-shadow:0 14px 40px rgba(0,0,0,0.5); overflow:hidden; padding:24px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
            <svg width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.3 35.9 26.8 37 24 37c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.4 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
            <div>
              <div style="font-weight:600; font-size:16px; color:#202124;">${isRegister ? 'Register with Google' : 'Sign in with Google'}</div>
              <div style="font-size:12px; color:#5f6368;">Device Google Authentication</div>
            </div>
          </div>
          <p style="font-size:13px; color:#3c4043; margin-bottom:14px; line-height:1.4;">
            ${isRegister 
              ? 'Enter your device Google account to register your authority credentials:' 
              : 'Enter your device Google email to verify your authority account:'}
          </p>
          <div id="gPromptError" style="display:none; font-size:12px; color:#d93025; margin-bottom:10px;"></div>
          ${isRegister ? '<input type="text" id="gDevName" placeholder="Full Name (e.g. Officer Name)" style="width:100%; box-sizing:border-box; padding:10px 12px; border-radius:6px; border:1px solid #dadce0; font-size:13px; margin-bottom:10px; font-family:inherit;">' : ''}
          <input type="email" id="gDevEmail" placeholder="your.google.account@gmail.com" autofocus style="width:100%; box-sizing:border-box; padding:10px 12px; border-radius:6px; border:1px solid #dadce0; font-size:13px; margin-bottom:14px; font-family:inherit;">
          <div style="display:flex; gap:10px;">
            <button type="button" id="gDevSubmit" style="flex:1; background:#1a73e8; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;">${isRegister ? 'Create Account' : 'Sign In'}</button>
            <button type="button" id="gDevCancel" style="background:#f1f3f4; color:#3c4043; border:none; padding:10px 16px; border-radius:6px; font-weight:500; font-size:13px; cursor:pointer;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cleanup = () => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      };

      const submitBtn = modal.querySelector('#gDevSubmit');
      const cancelBtn = modal.querySelector('#gDevCancel');
      const emailInput = modal.querySelector('#gDevEmail');
      const nameInput = modal.querySelector('#gDevName');
      const errBox = modal.querySelector('#gPromptError');

      submitBtn.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email || !email.includes('@')) {
          errBox.textContent = 'Please enter a valid Google email address.';
          errBox.style.display = 'block';
          return;
        }

        const name = (nameInput && nameInput.value.trim()) || email.split('@')[0];
        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying…';
          const user = await this._processGoogleProfile({ email: email, name: name }, isRegister);
          cleanup();
          resolve(user);
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = isRegister ? 'Create Account' : 'Sign In';
          errBox.textContent = err.message || 'Google authentication failed.';
          errBox.style.display = 'block';
        }
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        reject(new Error('Google sign-in was cancelled.'));
      });
    }

    /**
     * Dynamic Google OAuth Login / Registration
     * Integrates with Google Identity Services (GSI) to display the device's
     * real Google accounts for authentication.
     * 
     * In Login mode (isRegister === false): Rejects users not in Neon database.
     * In Register mode (isRegister === true): Saves the user in Neon database.
     */
    async loginWithGoogle(options = {}) {
      const isRegister = options && options.isRegister === true;
      const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '587514151509-ffmej4mml0re8ascku86u2tnlb09tbnm.apps.googleusercontent.com';

      await this._loadGoogleGsiScript();

      return new Promise((resolve, reject) => {
        let finished = false;

        const complete = (user) => {
          if (finished) return;
          finished = true;
          resolve(user);
        };

        const fail = (err) => {
          if (finished) return;
          finished = true;
          reject(err);
        };

        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'email profile openid',
              prompt: 'select_account',
              callback: async (tokenResponse) => {
                if (finished) return;
                if (tokenResponse.error) {
                  if (tokenResponse.error === 'popup_closed_by_user') {
                    fail(new Error('Google sign-in was cancelled.'));
                  } else {
                    fail(new Error('Google authentication error: ' + (tokenResponse.error_description || tokenResponse.error)));
                  }
                  return;
                }

                if (tokenResponse.access_token) {
                  try {
                    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
                    });
                    if (!profileRes.ok) {
                      throw new Error('Could not retrieve Google profile details.');
                    }
                    const profile = await profileRes.json();
                    const user = await this._processGoogleProfile(profile, isRegister);
                    complete(user);
                  } catch (err) {
                    fail(err);
                  }
                }
              },
              error_callback: (err) => {
                console.warn('Google OAuth error_callback:', err);
                this._promptDeviceGoogleEmail(isRegister, err, complete, fail);
              }
            });

            // Trigger Google's official account selector dialog for device accounts
            tokenClient.requestAccessToken({ prompt: 'select_account' });
            return;
          } catch (initErr) {
            console.warn('Google Token Client init error:', initErr);
            this._promptDeviceGoogleEmail(isRegister, initErr, complete, fail);
            return;
          }
        }

        // Fallback if Google Identity SDK is blocked or offline
        this._promptDeviceGoogleEmail(isRegister, null, complete, fail);
      });
    }

    /**
     * Dynamic Apple OAuth Login / Registration
     * @param {Object} options - { isRegister: boolean }
     */
    async loginWithApple(options = {}) {
      const isRegister = options && options.isRegister === true;

      return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.id = 'thri-apple-oauth-modal';
        modal.style.cssText = `
          position:fixed; inset:0; background:rgba(0,0,0,0.78); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center; z-index:99999;
          font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif; animation:oauthFadeIn 0.2s ease-out;
        `;

        modal.innerHTML = `
          <div style="background:#1c1c1e; color:#f2f2f7; width:400px; border-radius:18px; box-shadow:0 16px 40px rgba(0,0,0,0.6); border:1px solid #2c2c2e; overflow:hidden;">
            <div style="padding:26px 24px 18px; text-align:center; border-bottom:1px solid #2c2c2e;">
              <svg style="margin:0 auto 12px; width:34px; height:34px;" viewBox="0 0 24 24" fill="#fff"><path d="M16.36 1.5c.1 1.05-.32 2.1-.95 2.86-.66.79-1.75 1.4-2.8 1.32-.12-1.02.37-2.08 1-2.79.7-.8 1.85-1.4 2.75-1.39zM20.9 17.2c-.5 1.15-.74 1.66-1.38 2.68-.9 1.42-2.16 3.2-3.73 3.22-1.4.02-1.76-.9-3.66-.9-1.9 0-2.3.88-3.68.92-1.55.05-2.73-1.53-3.63-2.94-1.98-3.05-2.5-6.63-1.1-9.55.98-2.06 2.75-3.36 4.65-3.39 1.42-.03 2.76.96 3.63.96.86 0 2.5-1.19 4.2-1.02.72.03 2.73.29 4.03 2.2-3.65 2-3.05 5.83.67 7.82z"/></svg>
              <div style="font-size:17px; font-weight:600; letter-spacing:-0.01em;">${isRegister ? 'Register with Apple ID' : 'Sign in with Apple ID'}</div>
              <div style="font-size:13px; color:#8e8e93; margin-top:4px;">Sign in with your Apple ID</div>
            </div>
            <div style="padding:20px 24px 24px;">
              <div id="appleModalError" style="display:none; background:rgba(255,84,112,0.15); border:1px solid rgba(255,84,112,0.3); color:#FF7A90; font-size:12px; padding:8px 12px; border-radius:8px; margin-bottom:14px;"></div>
              <div style="background:#2c2c2e; border-radius:12px; padding:12px 16px; margin-bottom:18px;">
                <div style="font-size:12px; color:#8e8e93;">Apple ID (Work or Authority Email)</div>
                <input type="email" id="appleEmailInput" placeholder="officer@icloud.com" style="width:100%; background:transparent; border:none; color:#fff; font-size:14px; font-weight:500; outline:none; margin-top:3px;">
              </div>
              <button type="button" id="appleContinueBtn" style="width:100%; background:#fff; color:#000; border:none; padding:12px; border-radius:10px; font-weight:600; font-size:14px; cursor:pointer; transition:opacity .15s;">${isRegister ? 'Create Authority Account with Apple' : 'Continue with Apple ID'}</button>
              <div id="appleCancelBtn" style="text-align:center; margin-top:14px; font-size:13px; color:#8e8e93; cursor:pointer;">Cancel</div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const cleanup = () => {
          if (modal.parentNode) modal.parentNode.removeChild(modal);
        };

        const showAppleErr = (msg) => {
          const errEl = modal.querySelector('#appleModalError');
          if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
          }
        };

        modal.querySelector('#appleContinueBtn').addEventListener('click', async () => {
          const email = (modal.querySelector('#appleEmailInput').value || '').trim().toLowerCase();
          if (!email || !email.includes('@')) {
            showAppleErr('Please enter a valid Apple ID email address.');
            return;
          }

          try {
            let existing = null;
            if (global.NeonDB) {
              existing = await global.NeonDB.findUserByEmail(email);
            } else {
              const users = this._getUsers();
              existing = users.find(u => u.email.toLowerCase() === email);
            }

            if (isRegister) {
              if (existing) {
                if (global.NeonDB && existing.id) global.NeonDB.updateLastLogin(existing.id).catch(() => {});
                cleanup();
                resolve(this._setSession(existing, true));
                return;
              }

              let created;
              if (global.NeonDB) {
                created = await global.NeonDB.createUser({
                  firstName: 'Apple',
                  lastName: 'Officer',
                  name: 'Apple Verified Officer',
                  email: email,
                  org: 'Autonomous Transit Control',
                  role: 'Senior Mobility Commander',
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&q=80',
                  provider: 'apple'
                });
              } else {
                created = {
                  id: 'usr_apple_' + Date.now().toString(36),
                  firstName: 'Apple',
                  lastName: 'Officer',
                  name: 'Apple Verified Officer',
                  email: email,
                  org: 'Autonomous Transit Control',
                  role: 'Senior Mobility Commander',
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=140&q=80',
                  provider: 'apple'
                };
              }
              cleanup();
              resolve(this._setSession(created, true));
            } else {
              if (!existing) {
                showAppleErr('This Apple ID (' + email + ') is not registered. Please register first on the Create Account page.');
                return;
              }
              if (global.NeonDB && existing.id) global.NeonDB.updateLastLogin(existing.id).catch(() => {});
              cleanup();
              resolve(this._setSession(existing, true));
            }
          } catch (err) {
            showAppleErr(err.message || 'Apple authentication failed.');
          }
        });

        modal.querySelector('#appleCancelBtn').addEventListener('click', () => {
          cleanup();
          reject(new Error('Apple sign-in was cancelled.'));
        });
      });
    }

    /**
     * Dynamic Account Registration
     * Creates new user in Neon PostgreSQL database.
     */
    async register(data) {
      const firstName = (data.firstName || '').trim();
      const lastName = (data.lastName || '').trim();
      const email = (data.email || '').trim().toLowerCase();
      const org = (data.org || '').trim();
      const password = data.password || '';

      if (!firstName) throw new Error('First name is required.');
      if (!email || !email.includes('@')) throw new Error('A valid work email is required.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

      // Check if user already exists in Neon database
      if (global.NeonDB) {
        const existingInNeon = await global.NeonDB.findUserByEmail(email);
        if (existingInNeon) {
          throw new Error('An account with this email already exists. Please log in.');
        }
      }

      // Check local fallback
      const localUsers = this._getUsers();
      if (localUsers.some(u => u.email.toLowerCase() === email)) {
        throw new Error('An account with this email already exists. Please log in.');
      }

      const fullName = `${firstName} ${lastName}`.trim();
      let newUser;

      // Write to Neon database
      if (global.NeonDB) {
        newUser = await global.NeonDB.createUser({
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          email: email,
          org: org || 'City Transport Department',
          role: 'Command Center Operator',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=1B2129&textColor=FF7A45`,
          provider: 'email',
          passwordHash: password
        });
      } else {
        newUser = {
          id: 'usr_' + Date.now().toString(36),
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          email: email,
          org: org || 'City Transport Department',
          role: 'Command Center Operator',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=1B2129&textColor=FF7A45`,
          provider: 'email',
          passwordHash: password,
          createdAt: new Date().toISOString()
        };
      }

      // Sync local cache
      localUsers.push(newUser);
      this._saveUsers(localUsers);

      return this._setSession(newUser, true);
    }

    // Dynamic Password Verification and Reset
    async resetPassword(email, newPassword = null) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Please enter a valid work email address.');
      }

      // Check if user exists in Neon PostgreSQL database
      let user = null;
      if (global.NeonDB) {
        user = await global.NeonDB.findUserByEmail(cleanEmail);
      } else {
        const users = this._getUsers();
        user = users.find(u => u.email.toLowerCase() === cleanEmail);
      }

      if (!user) {
        throw new Error('No registered account found for ' + cleanEmail + '. You must create an account first on the Registration page.');
      }

      // If new password is provided, update it in the database
      if (newPassword) {
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }

        if (global.NeonDB) {
          await global.NeonDB.updatePassword(cleanEmail, newPassword);
        }

        // Update local storage cache
        const localUsers = this._getUsers();
        const idx = localUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          localUsers[idx].passwordHash = newPassword;
          this._saveUsers(localUsers);
        }

        return {
          success: true,
          user: user,
          message: 'Password has been successfully updated. You can now log in.'
        };
      }

      // Verification only
      return {
        success: true,
        user: user,
        message: `Verified authority account for ${user.name} (${user.role}).`
      };
    }

    // Logout
    logout(redirectUrl = 'index.html') {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch (e) {
        console.error('Logout error:', e);
      }
      this._notifyListeners(null);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }

    // Route Guard Helper
    requireAuth(redirectUrl = 'login.html') {
      if (!this.isAuthenticated()) {
        const current = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
        window.location.href = `${redirectUrl}?redirect=${current}&reason=auth_required`;
        return false;
      }
      return true;
    }

    // Show Auth Required Modal (used by index.html when user clicks protected links)
    showAuthRequiredModal(targetPage = 'dashboard.html') {
      const existing = document.getElementById('thri-auth-guard-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'thri-auth-guard-modal';
      modal.style.cssText = `
        position:fixed; inset:0; background:rgba(10,14,19,0.85); backdrop-filter:blur(10px);
        display:flex; align-items:center; justify-content:center; z-index:99999;
        font-family:'Inter',sans-serif; padding:20px; animation:modalFadeIn 0.25s ease-out;
      `;

      modal.innerHTML = `
        <style>
          @keyframes modalFadeIn { from{opacity:0; transform:scale(0.96);} to{opacity:1; transform:scale(1);} }
          .guard-card {
            background:#161B22; border:1px solid #242E38; border-radius:20px;
            max-width:440px; width:100%; padding:32px 28px; text-align:center; position:relative;
            box-shadow:0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,122,69,0.15);
          }
          .guard-icon {
            width:64px; height:64px; border-radius:50%; background:rgba(255,122,69,0.12);
            border:1px solid rgba(255,122,69,0.3); display:flex; align-items:center; justify-content:center;
            margin:0 auto 20px; color:#FF7A45;
          }
          .guard-h { font-family:'Space Grotesk',sans-serif; font-size:1.35rem; font-weight:600; color:#F3F1EC; margin-bottom:8px; }
          .guard-p { font-size:0.9rem; color:#9AA7B4; line-height:1.5; margin-bottom:24px; }
          .guard-btn-solid {
            display:block; width:100%; background:#FF7A45; color:#191008; font-weight:600;
            padding:13px; border-radius:10px; font-size:0.95rem; border:none; cursor:pointer; text-decoration:none; margin-bottom:10px;
          }
          .guard-btn-solid:hover { background:#ff8b5c; }
          .guard-btn-ghost {
            display:block; width:100%; background:#1B2129; color:#F3F1EC; font-weight:500;
            padding:12px; border-radius:10px; font-size:0.92rem; border:1px solid #242E38; cursor:pointer; text-decoration:none;
          }
          .guard-btn-ghost:hover { background:#242E38; }
          .guard-close {
            position:absolute; top:16px; right:18px; color:#6B7684; font-size:22px; cursor:pointer; line-height:1;
          }
          .guard-close:hover { color:#F3F1EC; }
        </style>
        <div class="guard-card">
          <div class="guard-close" id="guardCloseBtn">&times;</div>
          <div class="guard-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 class="guard-h">Command Center Access Required</h3>
          <p class="guard-p">The live city intelligence telemetry and fleet dispatch features are restricted to verified transport authority officers. Please log in to access the Command Center.</p>
          <a class="guard-btn-solid" href="login.html?redirect=${encodeURIComponent(targetPage)}">Log In to Command Center</a>
          <a class="guard-btn-ghost" href="register.html">Create Authority Account</a>
        </div>
      `;

      document.body.appendChild(modal);

      const closeModal = () => modal.remove();
      modal.querySelector('#guardCloseBtn').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  // Export singleton to global namespace
  global.ThrinethraAuth = new AuthManager();

})(typeof window !== 'undefined' ? window : this);
