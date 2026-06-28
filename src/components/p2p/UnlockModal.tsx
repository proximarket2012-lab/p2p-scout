"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Lock, CheckCircle2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { type Opportunity, regionEmoji } from "@/lib/types";
import { toast } from "sonner";

interface UnlockModalProps {
  opp: Opportunity | null;
  language: "fr" | "en";
  isAlreadyUnlocked: boolean;
  onClose: () => void;
  onUnlocked: (oppId: string) => void;
}

type State = "confirm" | "creating_invoice" | "waiting_payment" | "verifying" | "success" | "error";

export function UnlockModal({
  opp,
  language,
  isAlreadyUnlocked,
  onClose,
  onUnlocked,
}: UnlockModalProps) {
  const [state, setState] = useState<State>(isAlreadyUnlocked ? "success" : "confirm");
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  const isFr = language === "fr";
  // Guard: opp can be null when modal is closed. Compute starsPrice only if opp exists.
  const starsPrice = opp ? (opp.starsPrice ?? 25) : 25;

  useEffect(() => {
    if (opp) {
      setState(isAlreadyUnlocked ? "success" : "confirm");
      setError(null);
      setInvoiceUrl(null);
    }
  }, [opp, isAlreadyUnlocked]);

  useEffect(() => {
    if (opp) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [opp]);

  if (!opp) return null;

  const handleConfirmUnlock = async () => {
    setState("creating_invoice");
    setError(null);
    try {
      // Include Telegram initData for authentication
      const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
      const initData = tg?.initData;
      const res = await fetch(`/api/opportunities/${opp.id}/invoice`, {
        method: "POST",
        headers: initData ? { "X-Telegram-Init-Data": initData } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }
      if (data.alreadyUnlocked) {
        setState("success");
        onUnlocked(opp.id);
        return;
      }
      setInvoiceUrl(data.invoiceUrl);
      setState("waiting_payment");

      // Open Telegram Stars invoice
      const tg = (window as unknown as { Telegram?: { WebApp?: { openInvoiceLink?: (url: string) => void } } }).Telegram?.WebApp;
      if (tg?.openInvoiceLink && data.invoiceUrl) {
        // Telegram WebApp SDK — opens native payment sheet
        tg.openInvoiceLink(data.invoiceUrl);
      } else {
        // Fallback: open in new tab (dev mode or non-Telegram context)
        window.open(data.invoiceUrl, "_blank");
        toast.info(isFr
          ? "Ouvre le lien dans un nouvel onglet pour payer avec tes Stars Telegram"
          : "Open the link in a new tab to pay with your Telegram Stars"
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setState("error");
    }
  };

  const handleVerifyPayment = async () => {
    setState("verifying");
    setError(null);
    try {
      const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
      const initData = tg?.initData;
      const res = await fetch("/api/stars/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
        },
        body: JSON.stringify({ opportunityId: opp.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Payment verification failed");
      }
      setState("success");
      onUnlocked(opp.id);
      toast.success(isFr ? "Opportunité débloquée !" : "Opportunity unlocked!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setState("error");
    }
  };

  return (
    <AnimatePresence>
      {opp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto scrollbar-dark bg-[#0A1628] border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-5 py-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>{regionEmoji(opp.region)}</span>
                <div>
                  <div className="font-bold text-white text-base">{opp.pair}</div>
                  <div className="text-[11px] text-white/50">+{opp.spreadNet.toFixed(2)}% {isFr ? "net" : "net"}</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close">
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* CONFIRM STATE */}
              {state === "confirm" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FFD700] flex items-center justify-center shadow-lg">
                      <Lock className="h-7 w-7 text-[#0A1628]" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isFr ? "Débloquer cette opportunité" : "Unlock this opportunity"}
                    </h3>
                    <p className="text-xs text-white/60 mb-5 leading-relaxed">
                      {isFr ? (
                        <>
                          Accède au guide complet : vendeurs recommandés, prix d'achat et de vente exacts,
                          calcul du bénéfice détaillé, et message Telegram FR+EN prêt à partager.
                        </>
                      ) : (
                        <>
                          Get full access: recommended sellers, exact buy/sell prices, detailed profit calculation,
                          and a Telegram-ready message in FR+EN.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Price box */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#F5A623]/10 to-[#FFD700]/10 border border-[#F5A623]/30 p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">{isFr ? "Prix de déblocage" : "Unlock price"}</span>
                      <div className="inline-flex items-center gap-1.5">
                        <Star className="h-5 w-5 text-[#F5A623]" fill="#F5A623" />
                        <span className="text-2xl font-bold text-[#F5A623]">{starsPrice}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-white/40">
                      {isFr
                        ? "Paiement via Telegram Stars — débité de ton solde Telegram"
                        : "Paid via Telegram Stars — debited from your Telegram balance"}
                    </div>
                  </div>

                  {/* What you get */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-4">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
                      {isFr ? "Ce que tu obtiens" : "What you get"}
                    </div>
                    <ul className="space-y-1.5 text-xs text-white/70">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00C48C]" /> {isFr ? "Vendeurs + acheteurs recommandés" : "Recommended sellers + buyers"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00C48C]" /> {isFr ? "Prix d'achat + de vente exacts" : "Exact buy + sell prices"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00C48C]" /> {isFr ? "Calcul du bénéfice détaillé" : "Detailed profit calculation"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00C48C]" /> {isFr ? "Message Telegram FR+EN" : "Telegram message FR+EN"}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00C48C]" /> {isFr ? "Accès à vie à cette opportunité" : "Lifetime access to this opportunity"}</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleConfirmUnlock}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl gradient-success text-white font-semibold shadow-glow hover:shadow-success-glow transition-all"
                  >
                    <Star className="h-4 w-4" fill="white" />
                    {isFr ? "Payer" : "Pay"} {starsPrice} ⭐ {isFr ? "et débloquer" : "and unlock"}
                  </button>
                </motion.div>
              )}

              {/* CREATING INVOICE */}
              {state === "creating_invoice" && (
                <div className="text-center py-8">
                  <Loader2 className="h-10 w-10 text-[#6C3FC7] mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-white/70">{isFr ? "Création de la facture Telegram..." : "Creating Telegram invoice..."}</p>
                </div>
              )}

              {/* WAITING PAYMENT */}
              {state === "waiting_payment" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center">
                      <Star className="h-7 w-7 text-[#F5A623]" fill="#F5A623" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isFr ? "Paiement en attente" : "Payment pending"}
                    </h3>
                    <p className="text-xs text-white/60 mb-4 leading-relaxed">
                      {isFr ? (
                        <>
                          Une fenêtre Telegram s'est ouverte pour payer <strong className="text-[#F5A623]">{starsPrice} Stars</strong>.
                          Une fois le paiement effectué, clique sur le bouton ci-dessous pour confirmer.
                        </>
                      ) : (
                        <>
                          A Telegram window opened to pay <strong className="text-[#F5A623]">{starsPrice} Stars</strong>.
                          Once paid, click the button below to confirm.
                        </>
                      )}
                    </p>
                  </div>

                  {invoiceUrl && (
                    <a
                      href={invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 mb-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors"
                    >
                      {isFr ? "Ouvrir le lien de paiement" : "Open payment link"}
                    </a>
                  )}

                  <button
                    onClick={handleVerifyPayment}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl gradient-success text-white font-semibold shadow-glow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isFr ? "J'ai payé — confirmer" : "I've paid — confirm"}
                  </button>
                </motion.div>
              )}

              {/* VERIFYING */}
              {state === "verifying" && (
                <div className="text-center py-8">
                  <Loader2 className="h-10 w-10 text-[#00C48C] mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-white/70">{isFr ? "Vérification du paiement..." : "Verifying payment..."}</p>
                </div>
              )}

              {/* SUCCESS */}
              {state === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, delay: 0.1 }}
                      className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00C48C] to-[#00B5A3] flex items-center justify-center shadow-glow"
                    >
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {isFr ? "Opportunité débloquée !" : "Opportunity unlocked!"}
                    </h3>
                    <p className="text-xs text-white/60 mb-5 leading-relaxed">
                      {isFr ? (
                        <>Tu as désormais accès à toutes les informations. Bonne opportunité ! 🚀</>
                      ) : (
                        <>You now have access to all the information. Happy trading! 🚀</>
                      )}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00C48C]/15 border border-[#00C48C]/30 text-xs">
                      <Sparkles className="h-3 w-3 text-[#00C48C]" />
                      <span className="text-[#00C48C] font-semibold">{starsPrice} ⭐ {isFr ? "débités" : "debited"}</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full px-5 py-3 rounded-2xl gradient-success text-white font-semibold"
                  >
                    {isFr ? "Voir l'opportunité" : "View opportunity"}
                  </button>
                </motion.div>
              )}

              {/* ERROR */}
              {state === "error" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center">
                      <AlertTriangle className="h-7 w-7 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isFr ? "Une erreur est survenue" : "An error occurred"}
                    </h3>
                    <p className="text-xs text-white/60 mb-4">{error}</p>
                  </div>
                  <button
                    onClick={() => setState("confirm")}
                    className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10"
                  >
                    {isFr ? "Réessayer" : "Try again"}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
