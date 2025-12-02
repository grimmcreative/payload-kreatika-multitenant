'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

interface Tenant {
  id: number | string
  name: string
}

export const TenantDropdown: React.FC = () => {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'super-admin') {
      setLoading(false)
      return
    }

    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants?limit=1000', {
          credentials: 'include',
        })
        const data = await response.json()

        if (data.docs) {
          setTenants(data.docs)
        }
      } catch (error) {
        console.error('Error fetching tenants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null
      return null
    }

    const tenantFromCookie = getCookie('payload-selected-tenant')
    if (tenantFromCookie && tenantFromCookie !== 'all') {
      setSelectedTenant(tenantFromCookie)
    }
  }, [user])

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedTenant(value)

    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    document.cookie = `payload-selected-tenant=${value}; path=/; expires=${expires.toUTCString()}`
    window.location.reload()
  }

  const handleReset = () => {
    setSelectedTenant('all')
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    document.cookie = `payload-selected-tenant=all; path=/; expires=${expires.toUTCString()}`
    window.location.reload()
  }

  if (!user || user.role !== 'super-admin') {
    return null
  }

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.loading}>Loading tenants...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <svg
            style={styles.icon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.5 5.83333H2.5M14.1667 9.16667H5.83333M12.5 12.5H7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={styles.label}>Tenant Filter</span>
        </div>
        <div style={styles.selectWrapper}>
          <select
            id="tenant-selector"
            value={selectedTenant}
            onChange={handleTenantChange}
            style={{
              ...styles.select,
              ...(selectedTenant !== 'all' ? styles.selectActive : {}),
            }}
          >
            <option value="all">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          {selectedTenant !== 'all' && (
            <button
              type="button"
              onClick={handleReset}
              style={styles.reset}
              aria-label="Reset filter"
              title="Reset filter"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M13 1L1 13M1 1L13 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    margin: 0,
    padding: 0,
    borderBottom: '1px solid var(--theme-elevation-150)',
  },
  container: {
    padding: 'var(--base) 0',
    background: 'var(--theme-elevation-0)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: 'calc(var(--base) * 0.75)',
  },
  icon: {
    color: 'var(--theme-elevation-500)',
    flexShrink: 0,
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--theme-elevation-600)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  select: {
    flex: 1,
    width: '100%',
    padding: 'calc(var(--base) * 0.5) calc(var(--base) * 0.75)',
    paddingRight: 'calc(var(--base) * 2)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-s)',
    background: 'var(--theme-input-bg)',
    color: 'var(--theme-text)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right calc(var(--base) * 0.75) center',
    backgroundSize: '12px',
  },
  selectActive: {
    borderColor: 'var(--theme-success-500)',
    backgroundColor: 'var(--theme-success-50)',
    boxShadow: '0 0 0 1px var(--theme-success-200)',
  },
  reset: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--border-radius-s)',
    background: 'var(--theme-elevation-0)',
    color: 'var(--theme-elevation-600)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  loading: {
    padding: 'calc(var(--base) * 0.5)',
    fontSize: '0.875rem',
    color: 'var(--theme-elevation-500)',
    fontStyle: 'italic',
  },
}
