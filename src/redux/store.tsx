import { configureStore } from "@reduxjs/toolkit";
import allocatedSlice, { AllocatedArrayType } from "./allocatedSlice";
import { MoneyCalcReducer } from "./moneySlice";

const CART_KEY = "shoppingApp.cart";

// Restore the cart saved in this browser, so a page refresh doesn't empty it.
function loadCart(): AllocatedArrayType | undefined {
  try {
    const saved = localStorage.getItem(CART_KEY);
    const parsed = saved ? JSON.parse(saved) : undefined;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

const savedCart = loadCart();

export const store = configureStore({
  reducer: {
    allocatedBudget: allocatedSlice,
    moneyCalc: MoneyCalcReducer,
  },
  preloadedState: savedCart ? { allocatedBudget: savedCart } : undefined,
});

let lastSaved = store.getState().allocatedBudget;
store.subscribe(() => {
  const cart = store.getState().allocatedBudget;
  if (cart === lastSaved) return;
  lastSaved = cart;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage can be unavailable (private mode, full quota); the cart still works in memory.
  }
});

export type StoreType = ReturnType<typeof store.getState>;
export type DispatchType = typeof store.dispatch;
