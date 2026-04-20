import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api.js'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [inventory, setInventory] = useState([])
  const [sales, setSales] = useState([])
  const [alerts, setAlerts] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, invRes, alertsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/inventory'),
        api.get('/alerts'),
      ])
      setDashboardStats(statsRes.data)
      setInventory(invRes.data.items)
      setAlerts(alertsRes.data.alerts)
    } catch (e) {
      console.error('Dashboard fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const addInventoryItem = async (item) => {
    const res = await api.post('/inventory', item)
    setInventory(prev => [...prev, res.data.item])
    return res.data.item
  }

  const updateInventoryItem = async (id, updates) => {
    const res = await api.put(`/inventory/${id}`, updates)
    setInventory(prev => prev.map(i => i._id === id ? res.data.item : i))
    return res.data.item
  }

  const deleteInventoryItem = async (id) => {
    await api.delete(`/inventory/${id}`)
    setInventory(prev => prev.filter(i => i._id !== id))
  }

  const addSale = async (saleData) => {
    const res = await api.post('/sales', saleData)
    setSales(prev => [res.data.sale, ...prev])
    return res.data.sale
  }

  return (
    <ShopContext.Provider value={{
      inventory, sales, alerts, dashboardStats, loading,
      fetchDashboard, addInventoryItem, updateInventoryItem, deleteInventoryItem, addSale,
      setInventory, setSales
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
