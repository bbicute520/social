import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Social App - Frontend</h1>
      <p className="text-muted-foreground">Tailwind CSS + Shadcn/UI are ready!</p>
      <div className="flex gap-2">
        <Button variant="default">Click Me</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  )
}

export default App
