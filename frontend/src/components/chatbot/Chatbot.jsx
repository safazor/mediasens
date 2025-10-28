"use client"

import { useState } from "react"
import api from "../../api"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "system", content: "Tu es l’assistant Mediasens. Réponds brièvement." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return // Empêche double envoi

    const newMsgs = [...messages, { role: "user", content: text }]
    setMessages(newMsgs)
    setInput("")
    setLoading(true)

    // Timeout après 25s pour éviter blocage
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const { data } = await api.post(
        "/api/chat/",
        { messages: newMsgs },
        {
          headers: { Authorization: "" }, // force sans token
          signal: controller.signal,
        },
      )
      clearTimeout(timeout)

      const reply = data.reply?.trim() || "… (pas de réponse)"
      setMessages([...newMsgs, { role: "assistant", content: reply }])
    } catch (err) {
      console.error("Erreur chatbot:", err)
      let msg = "Erreur du chatbot."
      if (err.name === "CanceledError") msg = "Temps dépassé (25s)."
      setMessages([...newMsgs, { role: "assistant", content: msg }])
    } finally {
      clearTimeout(timeout)
      setLoading(false) // ✅ Toujours revenir à false
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-90 transition"
        title={open ? "Fermer le chatbot" : "Ouvrir le chatbot"}
      >
        {open ? "✖" : "💬"} Chat
      </button>

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0b1020] text-white shadow-2xl border-l border-white/10 z-40 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between bg-white/5 border-b border-white/10">
          <div className="font-semibold">
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Mediasens Assistant
            </span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
            ✖
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 h-[calc(100%-56px-84px)] overflow-y-auto">
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "ml-auto bg-indigo-600/90" : "mr-auto bg-white/10"
                }`}
              >
                {m.content}
              </div>
            ))}

          {loading && (
            <div className="mr-auto bg-white/10 rounded-2xl px-4 py-2 text-sm animate-pulse">
              Assistant est en train d’écrire…
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
          <input
            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Écrivez votre message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading} // ✅ Empêche la saisie pendant l’attente
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
        {/* Fin Drawer */}
      </div>
    </>
  )
}
