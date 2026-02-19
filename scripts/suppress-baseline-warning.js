"use strict"

const originalWarn = console.warn

console.warn = (...args) => {
  const firstArg = args[0]
  const message = typeof firstArg === "string" ? firstArg : ""

  if (message.includes("[baseline-browser-mapping] The data in this module is over two months old")) {
    return
  }

  originalWarn(...args)
}
