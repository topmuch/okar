'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { 
  Car, 
  Plus, 
  Bell, 
  FileText, 
  Settings, 
  LogOut,
  User,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  QrCode,
  X
} from 'lucide-react'
import type { Vehicle, Notification } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    mileage: 0,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Mock user for demo (in real app, this would come from auth)
  useEffect(() => {
    // Simulate fetching user data
    const mockUser = {
      id: 'demo-user-id',
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      role: 'OWNER',
    }
    setUser(mockUser)
    
    // Fetch vehicles
    fetchVehicles(mockUser.id)
    
    // Fetch notifications
    fetchNotifications(mockUser.id)
    
    setIsLoading(false)
  }, [])

  const fetchVehicles = async (userId: string) => {
    try {
      const response = await fetch(`/api/vehicles?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setVehicles(data.data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'year' || name === 'mileage' ? parseInt(value) || 0 : value 
    }))
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout du véhicule')
      }

      setVehicles((prev) => [...prev, data.data])
      setShowAddVehicle(false)
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        color: '',
        mileage: 0,
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setFormLoading(false)
    }
  }

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          userId: user?.id,
        }),
      })
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">OKAR</span>
            </Link>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto custom-scrollbar">
                    <div className="p-4 border-b sticky top-0 bg-white">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucune notification
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 cursor-pointer ${
                              !notification.isRead ? 'bg-primary-50' : ''
                            }`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900 hidden sm:inline">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 text-primary-600 bg-primary-50 font-medium"
                  >
                    <Car className="h-5 w-5" />
                    <span>Mes véhicules</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Documents</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Rendez-vous</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <Wrench className="h-5 w-5" />
                    <span>Entretiens</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <QrCode className="h-5 w-5" />
                    <span>QR Code</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Paramètres</span>
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Véhicules</p>
                      <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <Car className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Documents</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Alertes</p>
                      <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicles Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mes véhicules</CardTitle>
                  <CardDescription>Gérez vos véhicules et leurs documents</CardDescription>
                </div>
                <Button onClick={() => setShowAddVehicle(true)} className="bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun véhicule</h3>
                    <p className="text-gray-500 mb-4">
                      Commencez par ajouter votre premier véhicule
                    </p>
                    <Button onClick={() => setShowAddVehicle(true)} className="bg-primary-600 hover:bg-primary-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un véhicule
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {vehicle.image ? (
                              <img
                                src={vehicle.image}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Car className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {vehicle.make} {vehicle.model}
                              </h4>
                              <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
                              <p className="text-xs text-gray-400">{vehicle.year}</p>
                            </div>
                          </div>
                          <Badge variant={vehicle.status === 'ACTIVE' ? 'success' : 'secondary'}>
                            {vehicle.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {vehicle.mileage?.toLocaleString() || 0} km
                          </span>
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Voir détails
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    Rappels à venir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Contrôle technique</span>
                      <Badge variant="warning">Dans 30 jours</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Révision</span>
                      <Badge variant="info">Dans 60 jours</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Ajouter un document
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Wrench className="h-4 w-4 mr-2" />
                      Enregistrer un entretien
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <QrCode className="h-4 w-4 mr-2" />
                      Scanner un QR code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ajouter un véhicule</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddVehicle(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {formError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Marque *</Label>
                    <Input
                      id="make"
                      name="make"
                      placeholder="Peugeot"
                      value={formData.make}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modèle *</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="308"
                      value={formData.model}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Année *</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Couleur</Label>
                    <Input
                      id="color"
                      name="color"
                      placeholder="Noir"
                      value={formData.color}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Immatriculation *</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    placeholder="AB-123-CD"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">Kilométrage</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    min="0"
                    placeholder="50000"
                    value={formData.mileage}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddVehicle(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Ajout...
                      </>
                    ) : (
                      'Ajouter'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
