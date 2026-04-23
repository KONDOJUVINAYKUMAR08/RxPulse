import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'rxpulse_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { setItems([]); }
    }
  }, []);

  const persist = (newItems) => {
    setItems(newItems);
    localStorage.setItem(CART_KEY, JSON.stringify(newItems));
  };

  const addToCart = (medicine, quantity = 1, availableStock = 999) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicineId === medicine._id);
      let newItems;
      if (existing) {
        newItems = prev.map((i) =>
          i.medicineId === medicine._id
            ? { ...i, quantity: Math.min(i.quantity + quantity, availableStock) }
            : i
        );
      } else {
        newItems = [
          ...prev,
          {
            medicineId: medicine._id,
            medicineName: medicine.name,
            genericName: medicine.genericName,
            price: medicine.unitPrice,
            quantity,
            availableStock,
            unit: medicine.unit,
            requiresPrescription: medicine.requiresPrescription,
          },
        ];
      }
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeFromCart = (medicineId) => {
    const newItems = items.filter((i) => i.medicineId !== medicineId);
    persist(newItems);
  };

  const updateQuantity = (medicineId, newQty) => {
    if (newQty < 1) { removeFromCart(medicineId); return; }
    const newItems = items.map((i) =>
      i.medicineId === medicineId ? { ...i, quantity: Math.min(newQty, i.availableStock) } : i
    );
    persist(newItems);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  };

  const isInCart = (medicineId) => items.some((i) => i.medicineId === medicineId);
  const getQuantity = (medicineId) => items.find((i) => i.medicineId === medicineId)?.quantity || 0;

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalAmount, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
