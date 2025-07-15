import React from 'react';

interface PasteTipProps {
  className?: string;
  style?: React.CSSProperties;
}

const PasteTip: React.FC<PasteTipProps> = ({ className = '', style = {} }) => {
  return (
    <div 
      className={className}
      style={{
        marginTop: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#3b82f6',
        ...style
      }}
    >
      💡 <strong>Tip:</strong> You can paste files (Ctrl+V) anywhere on this page!
    </div>
  );
};

export default PasteTip; 