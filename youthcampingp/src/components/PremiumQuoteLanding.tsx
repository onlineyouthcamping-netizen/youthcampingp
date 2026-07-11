"use client";

import React from 'react';
import { Quotation } from '@/types';
import LuxuryQuotationUI from './LuxuryQuotationUI';

interface PremiumQuoteLandingProps {
  q: Quotation;
}

const PremiumQuoteLanding: React.FC<PremiumQuoteLandingProps> = ({ q }) => {
  return <LuxuryQuotationUI q={q} />;
};

export default PremiumQuoteLanding;
