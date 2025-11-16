import { defineStore } from 'pinia'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),

  getters: {
    totalPrice: (state) => {
      return state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      )
    },
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
  },

  actions: {
    addItem(item: CartItem) {
      const existingItem = this.items.find((i) => i.id === item.id)

      if (existingItem) {
        existingItem.quantity += item.quantity
      } else {
        this.items.push(item)
      }
    },

    removeItem(id: number) {
      this.items = this.items.filter((item) => item.id !== id)
    },

    updateQuantity(id: number, quantity: number) {
      const item = this.items.find((item) => item.id === id)
      if (item) {
        item.quantity = quantity
      }
    },

    clearCart() {
      this.items = []
    },
  },

  persist: true,
})
