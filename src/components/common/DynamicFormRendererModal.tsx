import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { DynamicForm } from '../../types/cmsAndErp';
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles
} from 'lucide-react';

interface DynamicFormRendererModalProps {
  form: DynamicForm | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicFormRendererModal: React.FC<DynamicFormRendererModalProps> = ({
  form,
  isOpen,
  onClose
}) => {
  const { submitDynamicForm } = useProjectData();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !form) return null;

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await submitDynamicForm(form.id, formData);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({});
        onClose();
      }, 2500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement de votre demande.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {form.name}
              </h3>
              <p className="text-xs text-slate-400">
                {form.departmentName || 'VIVA EVENT SOLUTIONS'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {form.description && (
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
            {form.description}
          </p>
        )}

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-white text-base">Soumission Confirmée !</h4>
            <p className="text-xs text-slate-300">
              Vos informations ont été enregistrées avec succès dans la base centrale VIVA EVENT SOLUTIONS.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {form.fields.sort((a, b) => a.order - b.order).map(field => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{field.label}</span>
                  {field.required && (
                    <span className="text-[10px] text-amber-400 font-bold">*Requis</span>
                  )}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Sélectionnez une option --</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2 pt-1">
                    {field.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt}
                          checked={formData[field.name] === opt}
                          onChange={e => handleChange(field.name, e.target.value)}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Transmission Sécurisée...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer la Demande</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
