'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'
import './styles.css'

interface Tenant {
  id: number | string
  name: string
}

export const TenantDropdown: React.FC = () => {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Only show for super-admins
  if (user?.role !== 'super-admin') {
    return null
  }

  useEffect(() => {
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

    // Load saved selection from cookie
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
  }, [])

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedTenant(value)

    // Set cookie with 30-day expiration
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    document.cookie = `payload-selected-tenant=${value}; path=/; expires=${expires.toUTCString()}`

    // Reload the page to apply the filter
    window.location.reload()
  }

  const handleReset = () => {
    setSelectedTenant('all')

    // Set cookie back to 'all'
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    document.cookie = `payload-selected-tenant=all; path=/; expires=${expires.toUTCString()}`

    // Reload the page
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="tenant-dropdown-wrapper">
        <div className="tenant-dropdown-container">
          <div className="tenant-dropdown-loading">Lade Tenants...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="tenant-dropdown-wrapper">
      <div className="tenant-dropdown-container">
        <div className="tenant-dropdown-header">
          <svg
            className="tenant-dropdown-icon"
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
          <span className="tenant-dropdown-label">Tenant Filter</span>
        </div>
        <div className="tenant-dropdown-select-wrapper">
          <select
            id="tenant-selector"
            value={selectedTenant}
            onChange={handleTenantChange}
            className={`tenant-dropdown-select ${selectedTenant !== 'all' ? 'active' : ''}`}
          >
            <option value="all">Alle Tenants</option>
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
              className="tenant-dropdown-reset"
              aria-label="Filter zurücksetzen"
              title="Filter zurücksetzen"
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
