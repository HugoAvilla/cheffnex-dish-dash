import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpStep {
    title: string;
    description: string;
    image?: string;
}

interface HelpTutorialModalProps {
    tutorialKey: string;
    title: string;
    steps: HelpStep[];
    forceShow?: boolean; // If triggered manually by a help button
    onClose?: () => void;
}

export function HelpTutorialModal({ tutorialKey, title, steps, forceShow = false, onClose }: HelpTutorialModalProps) {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        if (forceShow) {
            setOpen(true);
            setCurrentStep(0);
            setDontShowAgain(localStorage.getItem(`hide_tutorial_${tutorialKey}`) === "true");
            return;
        }

        const handleOpenEvent = () => {
            setOpen(true);
            setCurrentStep(0);
        };
        window.addEventListener('open-tutorial', handleOpenEvent);

        const hasHidden = localStorage.getItem(`hide_tutorial_${tutorialKey}`);
        let timer: any;
        if (!hasHidden) {
            // Small delay to make it feel less intrusive on page load
            timer = setTimeout(() => {
                setOpen(true);
            }, 500);
        }

        return () => {
            window.removeEventListener('open-tutorial', handleOpenEvent);
            if (timer) clearTimeout(timer);
        };
    }, [tutorialKey, forceShow]);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem(`hide_tutorial_${tutorialKey}`, "true");
        } else {
            localStorage.removeItem(`hide_tutorial_${tutorialKey}`);
        }
        setOpen(false);
        onClose?.();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Passo {currentStep + 1} de {steps.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-[150px] flex flex-col justify-center py-4 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <h3 className="font-semibold text-lg">{steps[currentStep].title}</h3>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {steps[currentStep].description}
                            </p>
                            {steps[currentStep].image && (
                                <div className="mt-4 rounded-md overflow-hidden border border-border bg-muted/30">
                                    <div className="aspect-video w-full flex items-center justify-center text-muted-foreground text-sm">
                                        [Imagem Ilustrativa: {steps[currentStep].image}]
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center bg-muted/50 -mx-6 -mb-6 p-4 sm:p-6 mt-2 rounded-b-lg border-t gap-4 sm:gap-0">
                    <div className="flex items-center space-x-2 mr-auto mb-2 sm:mb-0">
                        <Checkbox
                            id={`dont-show-${tutorialKey}`}
                            checked={dontShowAgain}
                            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                        />
                        <label
                            htmlFor={`dont-show-${tutorialKey}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Não mostrar novamente
                        </label>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {currentStep > 0 && (
                            <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 sm:flex-none">
                                Anterior
                            </Button>
                        )}
                        <Button type="button" onClick={handleNext} className="flex-1 sm:flex-none font-semibold">
                            {currentStep < steps.length - 1 ? "Próximo" : "Entendi"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
