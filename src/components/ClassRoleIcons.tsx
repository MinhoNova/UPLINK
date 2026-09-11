"use client";

import { classThumbUrl, roleIconUrl } from "@/lib/classThumb";

const roleIconScale = (role?: string) => (String(role || '').toLowerCase() === 'healer' ? 1.22 : 1.08);

const ClassRoleIcons = ({
   className,
   role,
   size = 96,
   overlap = 34,
   onRoleClick,
   roleLabel = "Role",
   classImgClassName = "",
   roleImgClassName = "",
}: {
   className?: string;
   role?: string;
   size?: number;
   overlap?: number;
   onRoleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
   roleLabel?: string;
   classImgClassName?: string;
   roleImgClassName?: string;
}) => {
   const normalizedClass = (className || 'WARRIOR').toUpperCase();
   const normalizedRole = (role || 'dps').toUpperCase();
   const classSrc = classThumbUrl(normalizedClass);

   return (
      <div className="flex items-center shrink-0" style={{ width: (size * 2) - overlap }}>
         <img
            src={classSrc || roleIconUrl(normalizedClass)}
            alt={className || "Class"}
            title={className || normalizedClass}
            className={`object-contain relative z-10 drop-shadow-lg ${classImgClassName}`}
            style={{ width: size, height: size }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = roleIconUrl(normalizedClass); }}
         />
         <div className="relative group shrink-0" style={{ width: size, height: size, marginLeft: -overlap }}>
            <img
               src={roleIconUrl(normalizedRole)}
               alt={role || "Role"}
               title={role || normalizedRole}
               className={`w-full h-full object-contain drop-shadow-lg ${roleImgClassName}`}
               style={{ transform: `scale(${roleIconScale(role)})`, transformOrigin: 'center' }}
            />
            {onRoleClick && (
               <div
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer z-20"
                  onClick={onRoleClick}
               >
                  <span className="text-[7px] font-black text-white uppercase tracking-widest">{roleLabel}</span>
               </div>
            )}
         </div>
      </div>
   );
};

export default ClassRoleIcons;
