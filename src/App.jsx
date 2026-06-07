import React, { useState } from 'react'
import { initialEvents, initialActivities, houses, rentalRooms } from './data.js'

export default function App() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white p-4 flex gap-4 border-b">
        <button onClick={() => setView('home')} className="font-bold">Avaleht</button>
        <button onClick={() => setView('events')}>Sündmused</button>
        <button onClick={() => setView('activities')}>Ringid</button>
      </nav>

      {view === 'home' && (
        <div className="p-8">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Tulevad sündmused</h2>
            <div className="grid gap-4">
              {initialEvents.map(e => <div key={e.id} className="bg-white p-4 border rounded shadow-sm">{e.title}</div>)}
            </div>
          </section>
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Meie rahvamajad</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {houses.map(h => <div key={h.name} className="bg-white p-4 border rounded">{h.name}</div>)}
            </div>
          </section>
          <section className="bg-purple-100 p-8 text-center rounded-xl">
            <h2 className="text-xl font-bold">Tule osalema meie huviringides!</h2>
            <button onClick={() => setView('activities')} className="mt-4 bg-purple-700 text-white px-4 py-2 rounded">Vaata ringe</button>
          </section>
        </div>
      )}

      {view === 'events' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Sündmused</h2>
          {initialEvents.map(e => <div key={e.id} className="bg-green-100 p-4 mb-2 rounded">{e.title} (Sündmus)</div>)}
        </div>
      )}

      {view === 'activities' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Ringid</h2>
          {initialActivities.map(a => (
            <div key={a.id} className="bg-purple-100 p-4 mb-2 rounded">
              <h3 className="font-bold">{a.title}</h3>
              <p className="text-sm">Juhendaja: {a.instructor}</p>
              <p className="text-sm italic">{a.joinInfo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
