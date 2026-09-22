import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function OfficeInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Afghanistan Office */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base text-primary flex justify-between items-center">
            <span>AFGHANISTAN OFFICE</span>
            <span dir="rtl">دفتر افغانستان</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <p>2nd Floor, 16 No. Office, Shahidano Chowk,</p>
          <p>Etimad Rahmi Market, Kandahar, Afghanistan</p>
          <p><span className="font-medium text-foreground">Licence:</span> 2401-2198</p>
          <p><span className="font-medium text-foreground">Email:</span> transport@skyariana.com | info@skyariana.com</p>
          <p><span className="font-medium text-foreground">Mob:</span> +93 700 939 365 | +93 711 4355 29</p>
        </CardContent>
      </Card>

      {/* Iran Office */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base text-primary flex justify-between items-center">
            <span>IRAN OFFICE</span>
            <span dir="rtl">دفتر ایران</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <p>Cubic Building, Bandar Abbas, Iran</p>
          <p><span className="font-medium text-foreground">P.O.Box:</span> 7913973295</p>
          <p><span className="font-medium text-foreground">Telefax:</span> +98 76 32226028</p>
          <p><span className="font-medium text-foreground">Cell:</span> +98 09172325086</p>
          <p><span className="font-medium text-foreground">Email:</span> info@balambarbaran.com | balambarceo@gmail.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
