import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface WizardData {
    nome: string;
    idade: string;
    genero: string;
    cidade_estado_pais: string;
    renda_mensal: string;

    status_parental: string;
    estado_civil: string;
    escolaridade: string;
    status_proprietario: string;
    emprego_atual: string;

    como_conheceu: string;
    tempo_conhece: string;
    comprou_similar: string;
    influencia_compra: string;

    sobre_voce: string;
    objetivos: string;

    sonhos: string;
    dificuldades_medos: string;
    ferramenta_desejada: string;
}

const initialData: WizardData = {
    nome: "", idade: "", genero: "", cidade_estado_pais: "", renda_mensal: "",
    status_parental: "", estado_civil: "", escolaridade: "", status_proprietario: "", emprego_atual: "",
    como_conheceu: "", tempo_conhece: "", comprou_similar: "", influencia_compra: "",
    sobre_voce: "", objetivos: "",
    sonhos: "", dificuldades_medos: "", ferramenta_desejada: ""
};

const ChipSelection = ({
    options,
    value,
    onChange,
    allowOther = false,
    otherLabel = "Outros"
}: {
    options: string[],
    value: string,
    onChange: (val: string) => void,
    allowOther?: boolean,
    otherLabel?: string
}) => {
    const [isOther, setIsOther] = useState(allowOther && value !== "" && !options.includes(value));
    const [otherValue, setOtherValue] = useState(isOther ? value : "");

    const handleSelect = (opt: string) => {
        setIsOther(false);
        onChange(opt);
    };

    const handleOtherSelect = () => {
        setIsOther(true);
        onChange(otherValue);
    };

    const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtherValue(e.target.value);
        onChange(e.target.value);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isOther && value === opt
                            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                            }`}
                    >
                        {opt}
                    </button>
                ))}
                {allowOther && (
                    <button
                        type="button"
                        onClick={handleOtherSelect}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isOther
                            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                            }`}
                    >
                        {otherLabel}
                    </button>
                )}
            </div>
            {isOther && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Input
                        autoFocus
                        placeholder="Especifique..."
                        value={otherValue}
                        onChange={handleOtherChange}
                        className="w-full max-w-sm"
                    />
                </div>
            )}
        </div>
    );
};

export default function Obrigado() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardData>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const updateData = (field: keyof WizardData, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const validateStep = (currentStep: number): boolean => {
        let requiredFields: (keyof WizardData)[] = [];
        switch (currentStep) {
            case 1:
                requiredFields = ["nome", "idade", "genero", "cidade_estado_pais", "renda_mensal"];
                break;
            case 2:
                requiredFields = ["status_parental", "estado_civil", "escolaridade", "status_proprietario", "emprego_atual"];
                break;
            case 3:
                requiredFields = ["como_conheceu", "tempo_conhece", "comprou_similar", "influencia_compra"];
                break;
            case 4:
                requiredFields = ["sobre_voce", "objetivos"];
                break;
            case 5:
                requiredFields = ["sonhos", "dificuldades_medos", "ferramenta_desejada"];
                break;
        }

        const emptyFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === "");

        if (emptyFields.length > 0) {
            toast({
                variant: "destructive",
                title: "Atenção",
                description: "Por favor, preencha todas as perguntas desta etapa para continuar.",
            });
            return false;
        }

        return true;
    };

    const nextStep = () => {
        if (!validateStep(step)) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStep((prev) => Math.min(prev + 1, 5));
    };

    const prevStep = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(5)) return;

        setIsSubmitting(true);
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) {
                throw new Error("Sessão não encontrada. Por favor, faça login.");
            }

            const userId = userData.user.id;

            const { error: dbError } = await supabase
                .from('pesquisa_diagnostico_clientes')
                .insert({
                    user_id: userId,
                    ...data
                });

            if (dbError) throw dbError;

            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('nexano-extend-subscription', {
                body: {}
            });

            if (edgeError) {
                console.warn("Edge function warning (Nexano):", edgeError);
            }

            toast({
                title: "Diagnóstico concluído! 🎉",
                description: "Sua próxima mensalidade já foi cancelada e é por nossa conta. Bem-vindo ao Cheffnex.",
                duration: 8000,
            });

            setTimeout(() => {
                navigate("/admin");
            }, 2000);

        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: error.message || "Ocorreu um erro ao salvar suas respostas. Tente novamente.",
            });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pt-12 pb-24 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto w-full space-y-8">

                {/* Header Section */}
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
                        🎉 Pagamento Aprovado! Bem-vindo aos 1%.
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Você acaba de dar o passo definitivo para tirar seu restaurante do caos e assumir o controle real. O Cheffnex já está preparando o seu cérebro operacional nos bastidores.
                    </p>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Mas lembre-se: não adianta ter uma Ferrari se você não conhece a pista. Para garantir que você faça parte dos 0.1% que dominam o mercado, eu preparei um <span className="font-bold text-foreground">Presente Exclusivo de Aceleração: 1 Mês de Cheffnex 100% Grátis</span>.
                    </p>
                    <div className="bg-muted p-4 rounded-xl border border-border shadow-sm">
                        <p className="text-base font-medium">
                            Para destravar a sua próxima mensalidade por nossa conta e liberar seu acesso ao painel, preencha o seu Perfil de Diagnóstico abaixo. Leva menos de 2 minutos.
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mt-12">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Passo {step} de 5</span>
                        <span>{Math.round((step / 5) * 100)}% concluído</span>
                    </div>
                    <Progress value={(step / 5) * 100} className="h-3 rounded-full" />
                </div>

                {/* Form Container */}
                <div className="bg-card border border-border rounded-2xl shadow-lg p-6 md:p-10 mt-8 relative overflow-hidden">

                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                            <h2 className="text-2xl font-bold border-b pb-2">Informações Demográficas</h2>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Seu Nome Completo</label>
                                <Input
                                    placeholder="Digite seu nome completo"
                                    value={data.nome}
                                    onChange={(e) => updateData("nome", e.target.value)}
                                    className="max-w-md bg-background"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Sua Idade</label>
                                <ChipSelection
                                    options={["18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 ou mais"]}
                                    value={data.idade}
                                    onChange={(v) => updateData("idade", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Identidade de Gênero</label>
                                <ChipSelection
                                    options={["Masculino", "Feminino"]}
                                    allowOther={true}
                                    otherLabel="Outro / Prefiro não dizer"
                                    value={data.genero}
                                    onChange={(v) => updateData("genero", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Cidade, Estado e País onde mora</label>
                                <Input
                                    placeholder="Ex: São Paulo, SP, Brasil"
                                    value={data.cidade_estado_pais}
                                    onChange={(e) => updateData("cidade_estado_pais", e.target.value)}
                                    className="max-w-md bg-background"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Sua Renda Mensal Pessoal Aproximada</label>
                                <ChipSelection
                                    options={["Até R$ 3.000", "R$ 3.001 a R$ 6.000", "R$ 6.001 a R$ 10.000", "R$ 10.001 a R$ 20.000", "Acima de R$ 20.000"]}
                                    value={data.renda_mensal}
                                    onChange={(v) => updateData("renda_mensal", v)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                            <h2 className="text-2xl font-bold border-b pb-2">Detalhes Demográficos</h2>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Você tem filhos?</label>
                                <ChipSelection
                                    options={["Não", "Sim, 1 filho(a)", "Sim, 2 ou mais filhos(as)"]}
                                    value={data.status_parental}
                                    onChange={(v) => updateData("status_parental", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Estado Civil</label>
                                <ChipSelection
                                    options={["Solteiro(a)", "Casado(a) / União Estável", "Divorciado(a)", "Viúvo(a)"]}
                                    value={data.estado_civil}
                                    onChange={(v) => updateData("estado_civil", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Escolaridade</label>
                                <ChipSelection
                                    options={["Ensino Médio", "Ensino Superior (Incompleto)", "Ensino Superior (Completo)", "Pós-graduação / Mestrado"]}
                                    value={data.escolaridade}
                                    onChange={(v) => updateData("escolaridade", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">O imóvel que você mora é:</label>
                                <ChipSelection
                                    options={["Próprio", "Alugado", "Moro com familiares"]}
                                    value={data.status_proprietario}
                                    onChange={(v) => updateData("status_proprietario", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Qual o seu emprego/ocupação atual?</label>
                                <ChipSelection
                                    options={["Dedicação Exclusiva ao Restaurante", "Trabalho CLT + Restaurante", "Empresário (Outros negócios)", "Ainda vou abrir o restaurante"]}
                                    allowOther={true}
                                    value={data.emprego_atual}
                                    onChange={(v) => updateData("emprego_atual", v)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                            <h2 className="text-2xl font-bold border-b pb-2">Origem e Compra</h2>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Como você nos conheceu?</label>
                                <ChipSelection
                                    options={["Anúncio no Instagram / Facebook", "Pesquisa no Google", "Indicação de um amigo", "YouTube", "TikTok"]}
                                    allowOther={true}
                                    value={data.como_conheceu}
                                    onChange={(v) => updateData("como_conheceu", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Há quanto tempo você nos conhece?</label>
                                <ChipSelection
                                    options={["Conheci hoje", "Alguns dias", "Algumas semanas", "Alguns meses", "Mais de um ano"]}
                                    value={data.tempo_conhece}
                                    onChange={(v) => updateData("tempo_conhece", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Você já comprou algum sistema ou produto similar antes?</label>
                                <ChipSelection
                                    options={["Não, é a minha primeira vez", "Sim, já comprei de concorrentes menores", "Sim, já usei grandes sistemas do mercado"]}
                                    allowOther={true}
                                    otherLabel="Qual? Especifique..."
                                    value={data.comprou_similar}
                                    onChange={(v) => updateData("comprou_similar", v)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">O que mais influenciou você a se tornar cliente hoje?</label>
                                <ChipSelection
                                    options={["Funcionalidades exclusivas", "Preço e custo-benefício", "Confiança na marca/apresentação", "Cansado da solução atual que uso"]}
                                    allowOther={true}
                                    value={data.influencia_compra}
                                    onChange={(v) => updateData("influencia_compra", v)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                            <h2 className="text-2xl font-bold border-b pb-2">Aprofundamento I</h2>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Me fale um pouco sobre você e a história do seu restaurante.</label>
                                <p className="text-xs text-muted-foreground -mt-3 mb-2">Seja livre para contar como tudo começou.</p>
                                <Textarea
                                    placeholder="Escreva aqui..."
                                    value={data.sobre_voce}
                                    onChange={(e) => updateData("sobre_voce", e.target.value)}
                                    className="min-h-[120px] resize-y bg-background text-base"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Quais seus principais objetivos com a plataforma Cheffnex?</label>
                                <p className="text-xs text-muted-foreground -mt-3 mb-2">O que você espera que mude no seu dia a dia?</p>
                                <Textarea
                                    placeholder="Quero parar de perder dinheiro com..."
                                    value={data.objetivos}
                                    onChange={(e) => updateData("objetivos", e.target.value)}
                                    className="min-h-[120px] resize-y bg-background text-base"
                                />
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                            <h2 className="text-2xl font-bold border-b pb-2">Aprofundamento II (Último Passo)</h2>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Quais os seus maiores sonhos hoje?</label>
                                <p className="text-xs text-muted-foreground -mt-3 mb-2">Tanto profissionais quanto pessoais envolvendo o seu negócio.</p>
                                <Textarea
                                    placeholder="Meu sonho é abrir a segunda unidade e poder ter tempo livre para minha família..."
                                    value={data.sonhos}
                                    onChange={(e) => updateData("sonhos", e.target.value)}
                                    className="min-h-[120px] resize-y bg-background text-base"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Quais são suas maiores dificuldades ou medos?</label>
                                <Textarea
                                    placeholder="Tenho medo de fechar as portas, ou não conseguir pagar os fornecedores..."
                                    value={data.dificuldades_medos}
                                    onChange={(e) => updateData("dificuldades_medos", e.target.value)}
                                    className="min-h-[120px] resize-y bg-background text-base"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-base font-semibold block">Por fim, qual ferramenta ou função você adoraria ver implementada dentro da plataforma no futuro?</label>
                                <Textarea
                                    placeholder="Seria incrível se vocês tivessem..."
                                    value={data.ferramenta_desejada}
                                    onChange={(e) => updateData("ferramenta_desejada", e.target.value)}
                                    className="min-h-[120px] resize-y bg-background text-base"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="mt-10 flex items-center justify-between border-t pt-6">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={prevStep}
                            disabled={step === 1 || isSubmitting}
                            className="px-8"
                        >
                            Voltar
                        </Button>

                        {step < 5 ? (
                            <Button
                                size="lg"
                                onClick={nextStep}
                                className="px-10 shadow-lg"
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 shadow-lg bg-green-600 hover:bg-green-700 text-white font-bold animate-in zoom-in duration-300"
                            >
                                {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                                Destravar Meu Bônus e Acessar Painel
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
