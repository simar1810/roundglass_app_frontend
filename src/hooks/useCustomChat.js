import { useState } from "react"

export function useCustomChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => setInput(e.target.value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: input }]
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      })

      console.log(res)
      if (!res.ok || !res.body) throw new Error("Failed to stream response")

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let aiMessage = { id: Date.now().toString(), role: "assistant", parts: [{ type: "text", text: "" }] }

      setMessages((prev) => [...prev, aiMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter(line => line.trim().startsWith("data: "))

        for (const line of lines) {
          const data = line.replace("data: ", "")
          if (data === "[DONE]") {
            setIsLoading(false)
            return
          }

          try {
            // Append the streamed token
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? {
                    ...msg,
                    parts: [{ type: "text", text: msg.parts[0].text + data }]
                  }
                  : msg
              )
            )
          } catch (err) {
            console.error("Error parsing streamed message:", err)
          }
        }
      }
    } catch (err) {
      console.error("Stream failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, input, handleInputChange, handleSubmit, isLoading }
}
