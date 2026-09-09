/**
 * THRINETHRA - Neon PostgreSQL Database Client
 * Direct serverless HTTP connection to Neon database for user authentication,
 * registration verification, and audit logging.
 */

(function (global) {
  'use strict';

  const NEON_CONFIG = {
    connectionString: 'postgresql://neondb_owner:npg_kCrMU0l9LViJ@ep-rapid-sunset-a54uayxa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    sqlEndpoint: 'https://ep-rapid-sunset-a54uayxa.us-east-2.aws.neon.tech/sql'
  };

  // Default seed accounts for transport command center authority
  const SEED_USERS = [
    {
      id: 'usr_admin_001',
      first_name: 'Thri',
      last_name: 'Nethra',
      name: 'Thri Nethra',
      email: 'admin@thrinethra.gov',
      org: 'Bengaluru Metropolitan Transport Corp. (BMTC)',
      role: 'Chief Traffic Controller',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      provider: 'email',
      password_hash: 'Thrinethra2026!'
    },
    {
      id: 'usr_demo_002',
      first_name: 'Vikram',
      last_name: 'Rao',
      name: 'Vikram Rao',
      email: 'v.rao@transportauthority.gov',
      org: 'Urban Mobility Command',
      role: 'Fleet Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      provider: 'email',
      password_hash: 'Demo1234!'
    }
  ];

  class NeonDBClient {
    constructor() {
      this.endpoint = NEON_CONFIG.sqlEndpoint;
      this.connectionString = NEON_CONFIG.connectionString;
      this._initialized = false;
      this._initPromise = null;
    }

    async _getProxyEndpoint() {
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && window.location.port) {
          return '/api/neon-sql';
        }
      }
      return null;
    }

    /**
     * Execute SQL query over Neon serverless HTTP endpoint or local proxy
     * @param {string} query - SQL query with optional placeholders ($1, $2)
     * @param {Array} params - Array of parameter values
     * @returns {Promise<Array<Object>>} Array of row objects
     */
    async query(query, params = []) {
      const formattedParams = params.map(p => {
        if (p === null || p === undefined) return null;
        if (typeof p === 'object') return JSON.stringify(p);
        return String(p);
      });

      const body = {
        query: query.trim(),
        params: formattedParams
      };

      try {
        let response = null;
        const proxy = await this._getProxyEndpoint();

        // 1. If running on local server (e.g. http://localhost:3000), use proxy
        if (proxy) {
          try {
            response = await fetch(proxy, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } catch (e) {
            response = null;
          }
        }

        // 2. If on file:// or other port, try http://localhost:3000/api/neon-sql
        if (!response && typeof window !== 'undefined' && window.location.protocol === 'file:') {
          try {
            response = await fetch('http://localhost:3000/api/neon-sql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } catch (e) {
            response = null;
          }
        }

        // 3. Fall back to direct Neon endpoint
        if (!response) {
          try {
            response = await fetch(this.endpoint, {
              method: 'POST',
              headers: {
                'Neon-Connection-String': this.connectionString,
                'Neon-Raw-Text-Output': 'true',
                'Neon-Array-Mode': 'true'
              },
              body: JSON.stringify(body)
            });
          } catch (netErr) {
            response = null;
          }
        }

        if (!response) {
          return [];
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errData.message || `Neon SQL error (status ${response.status})`);
        }

        const data = await response.json();
        
        if (!data || !data.fields || !data.rows) {
          return [];
        }

        // Map array-mode rows to key-value objects
        const fields = data.fields.map(f => f.name);
        return data.rows.map(row => {
          const obj = {};
          fields.forEach((field, i) => {
            obj[field] = row[i];
          });
          return obj;
        });
      } catch (err) {
        console.error('Neon Database Query Error:', err);
        if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
          if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
            throw new Error('Browser blocked database fetch from file://. Please double-click "start-server.bat" or run "npm start" (http://localhost:3000) for full Neon database connectivity.');
          }
          throw new Error('Cannot reach Neon Database. Please verify your connection or start the local server via start-server.bat.');
        }
        throw err;
      }
    }

    /**
     * Ensure users table exists and seed initial demo accounts
     */
    async initSchema() {
      if (this._initialized) return true;
      if (this._initPromise) return this._initPromise;

      this._initPromise = (async () => {
        try {
          await this.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(100) PRIMARY KEY,
              first_name VARCHAR(100),
              last_name VARCHAR(100),
              name VARCHAR(200) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              org VARCHAR(255),
              role VARCHAR(100) DEFAULT 'Command Center Operator',
              avatar TEXT,
              provider VARCHAR(50) DEFAULT 'email',
              password_hash TEXT,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              last_login TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Seed default authority demo accounts if not already present
          for (const u of SEED_USERS) {
            const existing = await this.query(
              `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
              [u.email]
            );
            if (existing.length === 0) {
              await this.query(
                `INSERT INTO users (id, first_name, last_name, name, email, org, role, avatar, provider, password_hash)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (email) DO NOTHING;`,
                [u.id, u.first_name, u.last_name, u.name, u.email, u.org, u.role, u.avatar, u.provider, u.password_hash]
              );
            }
          }

          this._initialized = true;
          return true;
        } catch (err) {
          console.warn('Neon DB schema initialization warning:', err);
          return false;
        }
      })();

      return this._initPromise;
    }

    /**
     * Find a user by email address (case-insensitive)
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    async findUserByEmail(email) {
      await this.initSchema();
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) return null;

      const rows = await this.query(
        `SELECT id, first_name, last_name, name, email, org, role, avatar, provider, password_hash, created_at, last_login 
         FROM users 
         WHERE LOWER(email) = LOWER($1) 
         LIMIT 1;`,
        [cleanEmail]
      );

      if (rows.length === 0) return null;

      const r = rows[0];
      return {
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        name: r.name,
        email: r.email,
        org: r.org,
        role: r.role,
        avatar: r.avatar,
        provider: r.provider,
        passwordHash: r.password_hash,
        createdAt: r.created_at,
        lastLogin: r.last_login
      };
    }

    /**
     * Create a new user in Neon database
     * @param {Object} u - User data object
     * @returns {Promise<Object>} The created user record
     */
    async createUser(u) {
      await this.initSchema();
      const cleanEmail = (u.email || '').trim().toLowerCase();
      const firstName = (u.firstName || '').trim();
      const lastName = (u.lastName || '').trim();
      const name = (u.name || `${firstName} ${lastName}`.trim() || 'Officer').trim();
      const id = u.id || ('usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
      const org = (u.org || 'City Transport Department').trim();
      const role = (u.role || 'Command Center Operator').trim();
      const avatar = u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1B2129&textColor=FF7A45`;
      const provider = u.provider || 'email';
      const passwordHash = u.passwordHash || u.password || null;

      await this.query(
        `INSERT INTO users (id, first_name, last_name, name, email, org, role, avatar, provider, password_hash, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
        [id, firstName, lastName, name, cleanEmail, org, role, avatar, provider, passwordHash]
      );

      return {
        id,
        firstName,
        lastName,
        name,
        email: cleanEmail,
        org,
        role,
        avatar,
        provider,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    }

    /**
     * Update user's last login timestamp in Neon
     * @param {string} userId
     */
    async updateLastLogin(userId) {
      try {
        await this.query(
          `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1;`,
          [userId]
        );
      } catch (e) {
        console.warn('Failed to update last_login timestamp:', e);
      }
    }

    /**
     * Update a user's password in Neon database
     * @param {string} email
     * @param {string} newPassword
     * @returns {Promise<boolean>}
     */
    async updatePassword(email, newPassword) {
      await this.initSchema();
      const cleanEmail = (email || '').trim().toLowerCase();
      const user = await this.findUserByEmail(cleanEmail);
      if (!user) {
        throw new Error('No registered account found with email ' + cleanEmail);
      }

      await this.query(
        `UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2);`,
        [newPassword, cleanEmail]
      );
      return true;
    }

    /**
     * Check if Neon connection is operational
     * @returns {Promise<boolean>}
     */
    async testConnection() {
      try {
        const res = await this.query('SELECT 1 as connected;');
        return res && res.length > 0 && String(res[0].connected) === '1';
      } catch (e) {
        return false;
      }
    }
  }

  // Export singleton to global namespace
  global.NeonDB = new NeonDBClient();

  // Run initial schema verification in background
  if (typeof window !== 'undefined') {
    global.NeonDB.initSchema().catch(err => {
      console.warn('Neon initial sync:', err.message);
    });
  }

})(typeof window !== 'undefined' ? window : this);
