import { retailHerbalifePriorityProducts } from "@/config/data/retail"

export function sortByPriority(products, isWhitelabel = false) {
  if (!isWhitelabel) return products
  const filteredProducts = products
    .filter(product => !retailHerbalifePriorityProducts.has(product.productName))
  const sortedProducts = products
    .filter(product => retailHerbalifePriorityProducts.has(product.productName))
    .sort((a, b) => {
      const aPriority = retailHerbalifePriorityProducts.get(a.productName)
      const bPriority = retailHerbalifePriorityProducts.get(b.productName)
      return bPriority - aPriority > 0 ? -1 : 1
    })
  return [...sortedProducts, ...filteredProducts]
}