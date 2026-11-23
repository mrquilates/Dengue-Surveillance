import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Bell, ArrowRight } from 'lucide-react';
import { SurveillanceAlert } from '../types/surveillance';

interface AlertsAndAberrationsProps {
  alerts: SurveillanceAlert[];
  onOpenQualityAudit?: () => void;
}

export const AlertsAndAberrations: React.FC<AlertsAndAberrationsProps> = ({ alerts }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Outbreak Early Warning & Aberration Signals</h3>
            <p className="text-xs text-slate-400">Statistical threshold triggers and cluster anomaly alerts</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {alerts.length} Active Signals
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
          <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-slate-200">No Aberration Signals Detected</p>
          <p className="text-slate-500 mt-1">All monitored municipalities are operating within baseline endemic threshold limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                alert.level === 'CRITICAL' || alert.level === 'HIGH'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-amber-950/20 border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{alert.title}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    alert.level === 'CRITICAL' || alert.level === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {alert.level}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">{alert.description}</p>
              <div className="text-[10px] font-mono text-cyan-300 pt-1 border-t border-slate-800/80">
                Action: {alert.actionRequired}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
