import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Demo user — no login required
const DEMO_USER = {
  _id: 'demo_user_001',
  ownerName: 'Ramesh Kumar',
  shopName: 'Kumar General Store',
  mobile: '9876543210',
  city: 'Begusarai',
  state: 'Bihar',
  pincode: '851101',
  shopType: 'grocery',
}

export function AuthProvider({ children }) {
  const [user] = useState(DEMO_USER)
  const loading = false

  const login = async () => user
  const register = async () => user
  const logout = () => {}

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
