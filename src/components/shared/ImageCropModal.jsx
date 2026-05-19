import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import getCroppedImg from '@/utils/cropImage';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete, 
  aspectRatio = 1,
  title = "Ajustar Imagem" 
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      
      // Criar um File a partir do Blob para compatibilidade com o upload
      const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      await onCropComplete(croppedFile);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar o corte da imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card border-border shadow-2xl rounded-[2.5rem]">
        <DialogHeader className="p-6 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-xl font-black">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground font-medium">Arraste a imagem para reposicionar e use a barra para dar zoom.</p>
        </DialogHeader>
        
        <div className="relative w-full h-[400px] bg-black/90">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={onZoomChange}
              classes={{
                containerClassName: "h-full w-full",
              }}
            />
          )}
        </div>

        <div className="p-6 bg-muted/10 space-y-6">
          <div className="flex items-center gap-4 max-w-sm mx-auto">
            <ZoomOut className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(vals) => setZoom(vals[0])}
              className="flex-1"
            />
            <ZoomIn className="w-5 h-5 text-muted-foreground" />
          </div>

          <DialogFooter className="flex gap-3 justify-end sm:justify-end">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-xl h-12 font-bold px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl px-8 font-black shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                "Aplicar Corte"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
