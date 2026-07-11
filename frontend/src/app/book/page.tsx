'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Mail, Users, Bed, Train, 
  ChevronRight, ChevronLeft, Calendar, MapPin, CheckCircle2,
  Loader2, AlertCircle, Info, Navigation, ShieldCheck, Star, 
  Headset, Lock, Check, Sparkles, AlertTriangle, CreditCard, Building,
  Tag, ArrowLeft
} from 'lucide-react';
import { API_BASE_URL, normalizeImageUrl } from '@/lib/api';
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

// Hardcoded fallback list of Joining Points
const FALLBACK_JOINING_POINTS = [
  { cityName: 'Delhi', deductionAmount: 0, skipDays: 0, pickupPoint: 'Majnu ka Tilla' },
  { cityName: 'Mumbai', deductionAmount: 1500, skipDays: 1, pickupPoint: 'Bandra Terminus' },
  { cityName: 'Ahmedabad', deductionAmount: 1000, skipDays: 1, pickupPoint: 'Kalupur Station' },
  { cityName: 'Bengaluru', deductionAmount: 2000, skipDays: 2, pickupPoint: 'Majestic Terminal' },
  { cityName: 'Pune', deductionAmount: 1500, skipDays: 1, pickupPoint: 'Pune Railway Station' },
  { cityName: 'Direct Join', deductionAmount: 2500, skipDays: 2, pickupPoint: 'Base Camp / Destination' }
];



const parseTripDate = (dateStr?: string) => {
  if (!dateStr) {
    return { 
      day: 'Flexible', 
      month: 'DATE', 
      weekday: 'Flexible', 
      fullDate: 'Flexible Departure Date', 
      time: 'Date selected during checkout' 
    };
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { 
        day: '?', 
        month: 'DATE', 
        weekday: 'Flexible', 
        fullDate: dateStr, 
        time: 'Date selected during checkout' 
      };
    }
    const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      day: d.getDate().toString(),
      month: shortMonths[d.getMonth()],
      weekday: weekdays[d.getDay()],
      fullDate: `${weekdays[d.getDay()]}, ${d.getDate()} ${fullMonths[d.getMonth()]}`,
      time: '9:00 AM – 6:00 PM IST'
    };
  } catch (e) {
    return { 
      day: '?', 
      month: 'DATE', 
      weekday: 'Flexible', 
      fullDate: dateStr, 
      time: 'Date selected during checkout' 
    };
  }
};



function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initial parameters parsed from URL
  const initialParams = useMemo(() => {
    try {
      const trip = searchParams.get('trip');
      const date = searchParams.get('date');
      const tid = searchParams.get('tid');
      const price = searchParams.get('price');
      const salesperson = searchParams.get('salesperson');
      const pickupCity = searchParams.get('pickupCity');
      const payMode = searchParams.get('payMode');
      const bookAmt = searchParams.get('bookAmt');
      const sourceBookingLinkId = searchParams.get('sourceBookingLinkId');
      const sourceBookingLinkPayload = searchParams.get('sourceBookingLinkPayload');
      const sourceBookingLinkSignature = searchParams.get('sourceBookingLinkSignature');
      const customerName = searchParams.get('customerName');
      const customerPhone = searchParams.get('customerPhone');
      const customerEmail = searchParams.get('customerEmail');
      const travelerCount = searchParams.get('travelerCount');
      const customTime = searchParams.get('customTime');
      const headerTitle = searchParams.get('headerTitle');
      const headerSubtitle = searchParams.get('headerSubtitle');

      const sanitize = (val: string | null) => 
        val ? decodeURIComponent(val.replace(/\+/g, ' ')).trim() : '';

      return {
        tripName: sanitize(trip),
        date: sanitize(date),
        tripId: sanitize(tid),
        salesPersonName: sanitize(salesperson) || 'Direct',
        pickupCity: sanitize(pickupCity),
        payMode: sanitize(payMode),
        bookAmt: bookAmt ? (Number.isFinite(parseFloat(bookAmt)) ? parseFloat(bookAmt) : null) : null,
        sourceBookingLinkId: sanitize(sourceBookingLinkId),
        sourceBookingLinkPayload: sanitize(sourceBookingLinkPayload),
        sourceBookingLinkSignature: sanitize(sourceBookingLinkSignature),
        customerName: sanitize(customerName),
        customerPhone: sanitize(customerPhone),
        customerEmail: sanitize(customerEmail),
        travelerCount: travelerCount ? parseInt(travelerCount, 10) : null,
        customTime: sanitize(customTime),
        headerTitle: sanitize(headerTitle),
        headerSubtitle: sanitize(headerSubtitle),
        basePrice: price ? parseInt(price) : 0
      };
    } catch (e) {
      console.error("Failed to parse URL parameters:", e);
      return { 
        tripName: '', 
        date: '', 
        tripId: '', 
        salesPersonName: 'Direct', 
        pickupCity: '',
        payMode: '',
        bookAmt: null,
        sourceBookingLinkId: '',
        sourceBookingLinkPayload: '',
        sourceBookingLinkSignature: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        travelerCount: null,
        customTime: '',
        headerTitle: '',
        headerSubtitle: '',
        basePrice: 0 
      };
    }
  }, [searchParams]);

  // States
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataFetching, setDataFetching] = useState(true);
  const [error, setError] = useState('');
  const [tripData, setTripData] = useState<any>(null);
  const [basePrice, setBasePrice] = useState(initialParams.basePrice || 13999);
  const [travelerAutoFilled, setTravelerAutoFilled] = useState(false);

  // Dynamic joining points loaded from tripData or fallback
  const joiningPoints = useMemo(() => {
    const baselinePrice = tripData?.price || basePrice || 13999;
    const pointsList: any[] = [];
    const seenCities = new Set<string>();

    const addPoint = (cityName: string, price: number, deduction: number, skipDays: number, pickupPoint: string) => {
      const trimmedCity = (cityName || '').trim();
      if (!trimmedCity || seenCities.has(trimmedCity.toLowerCase())) return;
      seenCities.add(trimmedCity.toLowerCase());
      pointsList.push({
        cityName: trimmedCity,
        deductionAmount: deduction,
        skipDays,
        pickupPoint,
        price
      });
    };

    // 1. Location Variants
    if (tripData?.variants && Array.isArray(tripData.variants)) {
      tripData.variants.forEach((v: any) => {
        const cName = v.cityName || v.location || v.name || v.variantName || v.city;
        if (cName) {
          const variantPrice = Number(v.discountedPrice) || Number(v.originalPrice) || 0;
          const deduction = Math.max(0, baselinePrice - variantPrice);
          const pPoint = v.pickupPoint || v.landmark || v.station || v.address || (v.duration && !v.duration.includes('Day') ? v.duration : 'Assigned Landmark');
          addPoint(cName, variantPrice > 0 ? variantPrice : baselinePrice, deduction, Number(v.skipDays) || 0, pPoint);
        }
      });
    }

    // 2. Pickup Cities
    if (tripData?.pickupCities && Array.isArray(tripData.pickupCities)) {
      tripData.pickupCities.forEach((c: any) => {
        const cName = c.cityName || c.location || c.name;
        if (cName) {
          const deduction = Number(c.deductionAmount) || 0;
          const price = Math.max(0, baselinePrice - deduction);
          const pPoint = c.pickupPoint || c.landmark || c.station || 'Assigned Landmark';
          addPoint(cName, price, deduction, Number(c.skipDays) || 0, pPoint);
        }
      });
    }

    // 3. Fallback joining points if inventory list is empty
    if (pointsList.length === 0) {
      FALLBACK_JOINING_POINTS.forEach(p => {
        addPoint(p.cityName, Math.max(0, baselinePrice - p.deductionAmount), p.deductionAmount, p.skipDays, p.pickupPoint);
      });
    }

    return pointsList;
  }, [tripData, basePrice]);

  const [selectedCity, setSelectedCity] = useState<any>(FALLBACK_JOINING_POINTS[0]);
  
  // Keep selectedCity synced once joiningPoints are resolved, matching the url price param or localStorage if applicable
  useEffect(() => {
    if (joiningPoints.length > 0) {
      const normalize = (s: string) =>
        (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

      // 1. Primary Source of Truth: If token/link prefilled a pickup city in URL, use it as top priority
      if (initialParams.pickupCity) {
        const target = normalize(initialParams.pickupCity);
        const matched = joiningPoints.find((j: any) => {
          const cName = normalize(j.cityName);
          return cName === target || cName.includes(target) || target.includes(cName);
        });
        if (matched) {
          setSelectedCity(matched);
          return;
        }
      }

      // 2. Secondary Source: Check localStorage for previous user session preference
      const tripId = tripData?.id || initialParams.tripId || 'default';
      const storageKey = `selected_joining_point_${tripId}`;
      const persistedCityName = localStorage.getItem(storageKey);

      if (persistedCityName) {
        const target = normalize(persistedCityName);
        const matched = joiningPoints.find((j: any) => {
          const cName = normalize(j.cityName);
          return cName === target || cName.includes(target) || target.includes(cName);
        });
        if (matched) {
          setSelectedCity(matched);
          return;
        }
      }

      // 3. Tertiary Source: Match by base price variant index
      if (initialParams.basePrice && tripData?.variants && Array.isArray(tripData.variants)) {
        const matchingVariantIdx = tripData.variants.findIndex((v: any) => v.discountedPrice === initialParams.basePrice);
        if (matchingVariantIdx !== -1 && matchingVariantIdx < joiningPoints.length && joiningPoints[matchingVariantIdx]) {
          setSelectedCity(joiningPoints[matchingVariantIdx]);
          return;
        }
      }
      setSelectedCity(joiningPoints[0]);
    }
  }, [joiningPoints, initialParams.basePrice, initialParams.pickupCity, tripData]);


  const [paymentMode, setPaymentMode] = useState<'Full Payment' | 'Partial Payment'>('Full Payment');
  const [customDepositPerPax, setCustomDepositPerPax] = useState<number | null>(initialParams.bookAmt);

  // Prefill payment mode + custom deposit from tokenized booking link
  useEffect(() => {
    if (initialParams.payMode === 'Partial Payment') setPaymentMode('Partial Payment');
    else if (initialParams.payMode === 'Full Payment') setPaymentMode('Full Payment');
  }, [initialParams.payMode]);

  useEffect(() => {
    if (initialParams.bookAmt !== null && initialParams.bookAmt !== undefined && initialParams.bookAmt > 0) {
      setCustomDepositPerPax(initialParams.bookAmt);
    } else {
      setCustomDepositPerPax(null);
    }
  }, [initialParams.bookAmt]);

  // Checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Unified booking state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cityState: '',
    specialRequests: '',
    participants: 1,
    participantsList: [{ name: '', phone: '', email: '', age: '', gender: 'Male', roomSharing: 'Quad Sharing', trainOption: 'Sleeper', foodPreference: 'Normal Food' }]
  });

  // Fetch Trip information
  useEffect(() => {
    const fetchTrip = async () => {
      setDataFetching(true);
      setError('');
      try {
        let foundTrip = null;
        const targetIdentifier = initialParams.tripId || initialParams.tripName;
        
        if (targetIdentifier) {
          try {
            const res = await fetch(`${API_BASE_URL}/trips/public/lookup/${encodeURIComponent(targetIdentifier)}`);
            const json = await res.json();
            if (json.success && json.data) {
              foundTrip = json.data;
            }
          } catch (_err) {}
        }

        if (!foundTrip && initialParams.tripName) {
          const res = await fetch(`${API_BASE_URL}/trips/public/cards`);
          const json = await res.json();
          if (json.success && json.data.length > 0) {
            const normalize = (str: string) => 
              (str || '')
                .toLowerCase()
                .replace(/[\u2013\u2014-]/g, '-')
                .replace(/[^a-z0-9]/g, '')
                .trim();

            const targetNormalized = normalize(initialParams.tripName);
            const matched = json.data.find((t: any) => normalize(t.title) === targetNormalized || normalize(t.slug) === targetNormalized) ||
                        json.data.find((t: any) => normalize(t.title).includes(targetNormalized) || targetNormalized.includes(normalize(t.title)));
            if (matched && matched.id) {
              // Re-fetch full detail via public lookup
              try {
                const detailRes = await fetch(`${API_BASE_URL}/trips/public/lookup/${matched.id}`);
                const detailJson = await detailRes.json();
                if (detailJson.success && detailJson.data) {
                  foundTrip = detailJson.data;
                }
              } catch (_e) {
                foundTrip = matched;
              }
            }
          }
        }

        if (foundTrip) {
          setTripData(foundTrip);
          // Always use the master trip price as the baseline basePrice so that the variant deductions are calculated correctly from the baseline
          const baseline = foundTrip.price || (foundTrip.variants && foundTrip.variants.length > 0 ? Math.max(...foundTrip.variants.map((v: any) => v.discountedPrice || 0)) : 13999);
          setBasePrice(baseline);
        }
      } catch (err) {
        console.warn("Could not fetch live trip info, using fallback data.");
      } finally {
        setDataFetching(false);
      }
    };
    fetchTrip();
  }, [initialParams.tripId, initialParams.tripName, initialParams.basePrice]);

  // Adjust passengers list size dynamically
  const syncParticipantsCount = (count: number) => {
    const defaultRoomSharing = count === 2 ? 'Double Sharing' : count >= 3 ? 'Triple Sharing' : 'Quad Sharing';
    let list = [...formData.participantsList];
    
    // Auto-update room sharing for all members in the booking
    list = list.map(item => ({
      ...item,
      roomSharing: defaultRoomSharing
    }));

    if (list.length < count) {
      for (let i = list.length; i < count; i++) {
        list.push({ 
          name: '', 
          phone: '', 
          email: '', 
          age: '', 
          gender: 'Male', 
          roomSharing: defaultRoomSharing, 
          trainOption: 'Sleeper', 
          foodPreference: 'Normal Food' 
        });
      }
    } else if (list.length > count) {
      list.splice(count);
    }
    setFormData(prev => ({
      ...prev,
      participants: count,
      participantsList: list
    }));
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const list = [...formData.participantsList];
    list[index] = { ...list[index], [field]: value };
    setFormData(prev => ({ ...prev, participantsList: list }));
    
    // Disable future auto-fill if Traveler 1 is edited manually
    if (index === 0 && (field === 'name' || field === 'phone')) {
      setTravelerAutoFilled(true);
    }
  };

  // Check if selected variant is Direct Join / Excludes travel options
  const isDirectJoin = useMemo(() => {
    if (!tripData?.variants || !Array.isArray(tripData.variants)) return false;
    const selectedVariant = tripData.variants.find((v: any) => v.location === selectedCity?.cityName);
    return selectedVariant?.excludeTravel === true;
  }, [tripData, selectedCity]);

    // Pricing calculations
  const pricing = useMemo(() => {
    let originalTotalBase = 0;

    formData.participantsList.forEach((p) => {
      let travelerPrice = selectedCity?.price ?? basePrice;
      
      // Train options adjustment
      if (!isDirectJoin) {
        const trainOptions = tripData?.travelOptions?.length > 0 ? tripData.travelOptions : [
          { label: 'Sleeper', priceDelta: 0 },
          { label: '3AC', priceDelta: 2000 },
          { label: 'No Train', priceDelta: -1500 }
        ];
        const selectedTrainOpt = trainOptions.find((opt: any) => opt.label === p.trainOption);
        if (selectedTrainOpt) {
          travelerPrice += Number(selectedTrainOpt.priceDelta) || 0;
        }
      }

      // Room sharing options adjustment
      const roomOptions = tripData?.roomOptions?.length > 0 ? tripData.roomOptions : [
        { label: 'Triple Sharing', priceDelta: 0 },
        { label: 'Double Sharing', priceDelta: 1500 },
        { label: 'Quad Sharing', priceDelta: -500 }
      ];
      const selectedRoomOpt = roomOptions.find((opt: any) => opt.label === p.roomSharing);
      if (selectedRoomOpt) {
        travelerPrice += Number(selectedRoomOpt.priceDelta) || 0;
      }

      originalTotalBase += travelerPrice;
    });

    const netBase = originalTotalBase;
    
    // Partial payment details: configurable deposit per traveler (defaults to 2000)
    const depositPerPax = customDepositPerPax && customDepositPerPax > 0 ? customDepositPerPax : 2000;
    const partialBaseAmount = depositPerPax * formData.participants;

    // GST Calculation — use trip-configured GST rate, fallback to 5%
    const gstRate = (tripData?.gstPercentage ?? 5) / 100;
    
    let gstAmount = 0;
    let depositGst = 0;
    let finalTotal = 0;
    let advancePaid = 0;
    let remainingBalance = 0;

    // Full-package GST (used for total trip cost and remaining balance)
    const fullPackageGst = Math.round(netBase * gstRate);
    const fullPackageTotal = Math.round(netBase + fullPackageGst);

    if (paymentMode === 'Full Payment') {
      gstAmount = fullPackageGst;
      depositGst = fullPackageGst;
      finalTotal = fullPackageTotal;
      advancePaid = finalTotal;
      remainingBalance = 0;
    } else {
      // Partial Payment
      // depositGst = GST on the deposit amount only (e.g. deposit ₹5,000 → GST ₹250 → pay ₹5,250)
      // gstAmount = full package GST (total tax liability for the trip)
      depositGst = Math.round(partialBaseAmount * gstRate);
      gstAmount = fullPackageGst;
      finalTotal = Math.round(partialBaseAmount + depositGst);
      advancePaid = finalTotal;
      remainingBalance = Math.round(fullPackageTotal - finalTotal);
    }

    return {
      originalTotalBase,
      netBase: Math.round(netBase),
      partialBaseAmount: Math.round(partialBaseAmount),
      gstAmount,
      depositGst,
      gstDiscount: 0,
      finalTotal,
      advancePaid,
      remainingBalance,
      fullPackageGst,
      fullPackageTotal,
      totalAmount: fullPackageTotal
    };
  }, [basePrice, selectedCity, formData.participants, formData.participantsList, paymentMode, customDepositPerPax, tripData, isDirectJoin]);



  useEffect(() => {
    if (currentStep === 3) {
      const handleScroll = () => {
        const footerEl = document.querySelector('footer');
        if (footerEl) {
          const rect = footerEl.getBoundingClientRect();
          if (rect.top <= window.innerHeight) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
          }
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [currentStep]);

  // Step-by-Step validation
  const validateStep = () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentStep === 1) {
      if (!formData.name.trim()) return 'Lead Traveler Name is required';
      if (!formData.phone.trim()) return 'Mobile number is required';
      if (formData.phone.replace(/\D/g, '').length !== 10) return 'WhatsApp number must be a valid 10-digit number';
      if (!formData.cityState.trim()) return 'City/State is required';
      if (formData.email && formData.email.trim() !== '' && !emailRegex.test(formData.email.trim())) {
        return 'Please enter a valid email address';
      }
    } else if (currentStep === 2) {
      if (!selectedCity) return 'Please select a joining point';
      for (let i = 0; i < formData.participantsList.length; i++) {
        const traveler = formData.participantsList[i];
        if (!traveler.name.trim()) return `Name is required for Traveler ${i + 1}`;
        if (!traveler.phone.trim()) return `Mobile is required for Traveler ${i + 1}`;
        if (traveler.phone.replace(/\D/g, '').length !== 10) return `Traveler ${i + 1} mobile number must be 10 digits`;
        if (!traveler.age.trim()) return `Age is required for Traveler ${i + 1}`;
        if (traveler.email && traveler.email.trim() !== '' && !emailRegex.test(traveler.email.trim())) {
          return `Please enter a valid email address for Traveler ${i + 1}`;
        }
      }
    } else if (currentStep === 4) {
      if (!acceptTerms) return 'You must accept the Terms and Conditions to continue';
    }
    return '';
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    
    // Auto-fill Traveler 1 with Lead Contact details on first step transition
    if (currentStep === 1 && !travelerAutoFilled) {
      const list = [...formData.participantsList];
      if (list[0]) {
        if (!list[0].name.trim()) list[0].name = formData.name;
        if (!list[0].phone.trim()) list[0].phone = formData.phone;
        setFormData(prev => ({ ...prev, participantsList: list }));
      }
      setTravelerAutoFilled(true);
    }
    
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  // Submit Final Booking Data to /api/bookings/create
  const handleFinalSubmit = async () => {
    const valError = validateStep();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmail = (formData.email && formData.email.trim() && emailRegex.test(formData.email.trim())) ? formData.email.trim() : null;
      const validDate = (initialParams.date && !isNaN(Date.parse(initialParams.date))) ? new Date(initialParams.date).toISOString() : null;

      const payload = {
        fullName: formData.name,
        name: formData.name,
        mobile: formData.phone,
        phone: formData.phone,
        email: validEmail,
        numberOfTravelers: formData.participants,
        tripId: tripData?.id || initialParams.tripId || 'manual',
        tripName: initialParams.tripName || tripData?.title || 'Expedition',
        departureDate: validDate,
        sourceBookingLinkId: initialParams.sourceBookingLinkId || null,
        sourceBookingLinkPayload: initialParams.sourceBookingLinkPayload || null,
        sourceBookingLinkSignature: initialParams.sourceBookingLinkSignature || null,
        pickupCity: selectedCity?.cityName || 'Delhi',
        skipDays: selectedCity?.skipDays || 0,
        adjustedPrice: selectedCity?.price ?? (pricing.originalTotalBase / formData.participants),
        baseAmount: pricing.netBase,
        amount: pricing.totalAmount,
        totalAmount: pricing.totalAmount,
        advancePaid: pricing.advancePaid,
        remainingAmount: pricing.remainingBalance,
        status: 'pending',
        paymentStatus: paymentMode === 'Full Payment' ? 'Paid' : 'Partial',
        paymentMode: 'UPI',
        notes: `City/State: ${formData.cityState}. Requests: ${formData.specialRequests}. WhatsApp Opt-in: ${whatsappOptIn ? 'Yes' : 'No'}`,
        passengers: formData.participantsList.map(p => ({
          name: p.name,
          phone: p.phone,
          email: (p.email && p.email.trim() && emailRegex.test(p.email.trim())) ? p.email.trim() : null,
          age: parseInt(p.age) || null,
          gender: p.gender,
          roomSharing: p.roomSharing,
          trainOption: p.trainOption,
          foodPreference: p.foodPreference || 'Normal Food'
        })),
        trainClass: formData.participantsList[0]?.trainOption || 'Sleeper',
        roomType: formData.participantsList[0]?.roomSharing || 'Triple Sharing',
        ticketStatus: 'Not Booked',
        basePrice: basePrice,
        gstAmount: pricing.gstAmount,
        depositGst: pricing.depositGst
      };

      const res = await fetch(`${API_BASE_URL}/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const bId = data?.data?.bookingId || data?.data?.id || data?.data?._id || 'YC-SUCCESS';
      if (res.ok || data.success) {
        router.push(`/book/confirmation?bookingId=${bId}`);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const detailMsgs = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
          setError(`Validation failed: ${detailMsgs}`);
        } else {
          setError(data.message || 'Submission failed. Please check your data and try again.');
        }
      }
    } catch (err) {
      setError('Connection to booking engine failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parsedDate = useMemo(() => parseTripDate(initialParams.date), [initialParams.date]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-slate-900 pb-36 lg:pb-36">
      {/* Top logo & waitlist header */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-6 sticky top-0 z-40 flex items-center justify-between">
        <div className="font-extrabold text-sm tracking-tight text-slate-900 font-serif">
          {initialParams.headerTitle || 'Talk That Damn Point'}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-bold text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 stroke-[3px]" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Area: Event Details + Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trip Poster Card */}
            <div className="relative w-full rounded-[24px] overflow-hidden bg-slate-950 shadow-md aspect-[16/10] md:aspect-[16/9] flex items-center justify-center p-4 md:p-8">
              {/* background image blurred */}
              {tripData?.images?.[0] ? (
                <OptimizedImage 
                  src={normalizeImageUrl(tripData.images[0])} 
                  alt={initialParams.tripName} 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-105"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 to-slate-950" />
              )}

              {/* Framed Side-by-Side Images */}
              <div className="relative z-10 flex items-center justify-center gap-4 w-full h-full">
                {/* Left Image in White Border Frame */}
                <div className="border-[6px] border-white shadow-2xl overflow-hidden w-[45%] aspect-[4/5] bg-slate-800 rounded-sm transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                  {tripData?.images?.[0] ? (
                    <OptimizedImage 
                      src={normalizeImageUrl(tripData.images[0])} 
                      alt="Trip preview 1" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white/20 text-xs">No Image</div>
                  )}
                </div>

                {/* Right Image / Styled Poster fallback */}
                <div className="w-[50%] aspect-[4/5] overflow-hidden bg-white shadow-2xl rounded-sm p-4 flex flex-col justify-between border border-slate-100">
                  {tripData?.images?.[1] ? (
                    <OptimizedImage 
                      src={normalizeImageUrl(tripData.images[1])} 
                      alt="Trip preview 2" 
                      className="w-full h-full object-cover rounded-xs"
                    />
                  ) : (
                    // Elegant text poster fallback
                    <div className="flex flex-col h-full justify-between text-slate-900">
                      <div>
                        <p className="text-[7px] font-extrabold uppercase tracking-widest text-[#FF5B00]">Expedition</p>
                        <h4 className="text-xs md:text-sm font-black tracking-tight leading-tight mt-1 line-clamp-3">
                          {initialParams.tripName || 'Storytelling Night'}
                        </h4>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">
                          DATE: {parsedDate.month} {parsedDate.day}
                        </div>
                        <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                          VENUE: {selectedCity?.cityName || tripData?.location || 'TBD'}
                        </div>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between items-center text-[7px] font-bold">
                        <span className="text-slate-400">Price</span>
                        <span className="text-slate-900 font-extrabold">₹{(tripData?.price || basePrice).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
              {initialParams.tripName || 'Adventure Expedition'}
            </h1>

            {/* Date and Location Info Card */}
            <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-4">
              {/* Date */}
              <div className="flex items-center gap-4">
                {/* Calendar Badge */}
                <div className="w-12 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs flex flex-col shrink-0">
                  <div className="bg-rose-500 text-white text-[8px] font-bold py-0.5 text-center uppercase tracking-widest">
                    {parsedDate.month}
                  </div>
                  <div className="flex-1 flex items-center justify-center font-bold text-lg text-slate-800 leading-none">
                    {parsedDate.day}
                  </div>
                </div>
                {/* Date text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-extrabold text-slate-900 leading-tight">
                    {parsedDate.fullDate}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {initialParams.customTime || parsedDate.time}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Location / Joining Point */}
              <div className="flex items-center gap-4">
                {/* Location Icon Badge */}
                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                  <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                {/* Location text */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">
                    Joining Point
                  </p>
                  <p className="text-sm md:text-base font-extrabold text-slate-900 leading-tight capitalize mt-0.5">
                    {typeof selectedCity === 'object' && selectedCity?.cityName ? selectedCity.cityName : (tripData?.location || 'Delhi')}
                    {typeof selectedCity === 'object' && selectedCity?.pickupPoint ? ` (${selectedCity.pickupPoint})` : ''}
                  </p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(typeof selectedCity === 'object' && selectedCity?.cityName ? `${selectedCity.cityName} ${selectedCity.pickupPoint || ''}` : (tripData?.location || 'Delhi'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-bold mt-0.5 inline-flex items-center gap-0.5 transition-colors"
                  >
                    Open in Maps <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* About the Experience Card */}
            {currentStep === 1 && (
              <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 shadow-sm space-y-2.5">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450">
                  ABOUT THE EXPERIENCE
                </h3>
                <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                  {tripData?.description || 'Join us for an incredible adventure designed to wow you at every step. Filled with curated stays, comfortable travel options, and exciting activities.'}
                </p>
              </div>
            )}

            {/* Progress Bar Container */}
            <div className="bg-white border border-slate-200/80 rounded-[20px] p-5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-sm">
              {[
                { step: 1, label: 'Lead Contact' },
                { step: 2, label: 'Travelers List' },
                { step: 3, label: 'Pricing Summary' },
                { step: 4, label: 'Verification' }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2 shrink-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                    currentStep >= item.step 
                      ? "bg-[#FF5B00] text-white shadow-sm" 
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}>
                    {currentStep > item.step ? <Check size={10} strokeWidth={4} /> : item.step}
                  </div>
                  <span className={cn(
                    "text-[8px] uppercase font-bold tracking-widest",
                    currentStep >= item.step ? "text-slate-900" : "text-slate-400"
                  )}>
                    {item.label}
                  </span>
                  {item.step < 4 && <div className={cn("w-4 md:w-8 h-[2px] bg-slate-100", currentStep > item.step && "bg-[#FF5B00]")} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm">
                                        <div className="border-b border-slate-100 pb-5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] mb-1.5">STEP 1 OF 4</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Lead Contact Details</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Primary booking supervisor</p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative group">
                        <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF5B00] transition-colors" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name *"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#FF5B00] focus:ring-4 focus:ring-[#FF5B00]/5 outline-none transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF5B00] transition-colors" />
                          <input
                            type="tel"
                            required
                            placeholder="WhatsApp Number *"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#FF5B00] focus:ring-4 focus:ring-[#FF5B00]/5 outline-none transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>

                        <div className="relative group">
                          <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF5B00] transition-colors" />
                          <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#FF5B00] focus:ring-4 focus:ring-[#FF5B00]/5 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* City/State Text Field */}
                      <div className="relative group">
                        <Building size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF5B00] transition-colors" />
                        <input
                          type="text"
                          required
                          placeholder="City/State *"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#FF5B00] focus:ring-4 focus:ring-[#FF5B00]/5 outline-none transition-all"
                          value={formData.cityState}
                          onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  {/* Joining Point Selection */}
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm">
                                        <div className="border-b border-slate-100 pb-5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] mb-1.5">ROUTE SELECTION</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{tripData?.bookingFormLabels?.joiningPoint || 'Joining Point'}</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Select where you want to meet us</p>
                    </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {joiningPoints.map((city: any) => {
                        const active = selectedCity?.cityName === city.cityName;
                        return (
                          <button
                            key={city.cityName}
                            type="button"
                            onClick={() => {
                              setSelectedCity(city);
                              const tripId = tripData?.id || initialParams.tripId || 'default';
                              localStorage.setItem(`selected_joining_point_${tripId}`, city.cityName);
                            }}
                            className={cn(
                              "text-left p-4 md:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[110px] h-auto w-full gap-2",
                              active 
                                ? "border-[#FF5B00] bg-[#FF5B00]/5 shadow-sm" 
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-300"
                            )}
                          >
                            <div className="flex justify-between w-full items-start gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs md:text-sm font-bold capitalize text-slate-800 whitespace-normal break-words">{city.cityName}</p>
                                <p className="text-[10px] text-slate-500 font-medium capitalize tracking-wider mt-1 whitespace-normal break-words leading-tight">{city.pickupPoint}</p>
                              </div>
                              {active && <Check size={14} className="text-[#FF5B00] shrink-0 mt-0.5" />}
                            </div>
                            {city.price !== undefined && (
                              <div className="mt-auto pt-2 border-t border-slate-100/50 w-full flex justify-between items-center text-[10px]">
                                <span className="uppercase tracking-wider text-slate-400 font-bold">Package Price</span>
                                <span className="font-extrabold text-slate-800 font-mono">₹{city.price.toLocaleString()}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Travelers Manifest Inputs */}
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm">
                                        <div className="border-b border-slate-100 pb-5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] mb-1.5">MANIFEST</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{tripData?.bookingFormLabels?.travelers || 'Traveler Manifest'}</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{tripData?.bookingFormLabels?.travelersDescription || 'Fill info for all tour members'}</p>
                    </div>

                    {/* Quick Traveler Count Select */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold capitalize tracking-wider text-slate-500 block">Number of Travelers</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => syncParticipantsCount(n)}
                            className={cn(
                              "py-3.5 rounded-xl font-bold text-xs transition-all border",
                              formData.participants === n 
                                ? "bg-[#FF5B00] border-[#FF5B00] text-white shadow-lg shadow-[#FF5B00]/25" 
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Participant detail loops */}
                    <div className="space-y-4 pt-2">
                      {formData.participantsList.map((traveler, index) => (
                        <div key={index} className="p-5 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-4">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00]">TRAVELER {index + 1} DETAILS</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              required
                              placeholder="Full Name *"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#FF5B00]"
                              value={traveler.name}
                              onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                            />
                            <input
                              required
                              placeholder="Mobile Number *"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#FF5B00]"
                              value={traveler.phone}
                              onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              required
                              type="number"
                              placeholder="Age *"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#FF5B00]"
                              value={traveler.age}
                              onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                            />
                            <select
                              aria-label={`Gender for traveler ${index + 1}`}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none"
                              value={traveler.gender}
                              onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                                                    {/* Room Sharing Option for this traveler */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">{tripData?.bookingFormLabels?.roomSharing || 'Room Sharing Option'}</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {(tripData?.roomOptions?.length > 0 ? tripData.roomOptions : [
                                { label: 'Double Sharing' }, { label: 'Triple Sharing' }, { label: 'Quad Sharing' }
                              ]).map((room: any) => (
                                <button
                                  key={room.label}
                                  type="button"
                                  onClick={() => handleParticipantChange(index, 'roomSharing', room.label)}
                                  className={cn(
                                    "py-2.5 rounded-lg font-bold text-[10px] border text-center transition-all min-h-[44px] flex items-center justify-center whitespace-normal break-words px-2 w-full",
                                    traveler.roomSharing === room.label ? "bg-[#FF5B00]/10 border-[#FF5B00] text-[#FF5B00]" : "bg-white border-slate-200 text-slate-500"
                                  )}
                                >
                                  {room.label}
                                </button>
                              ))}
                            </div>
                          </div>

                                                    {/* Train Class Option for this traveler */}
                          {!isDirectJoin && (
                             <div className="space-y-1.5 pt-1">
                               <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">{tripData?.bookingFormLabels?.travelOption || 'Train Ticket Option'}</label>
                               <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                 {(tripData?.travelOptions?.length > 0 ? tripData.travelOptions : [
                                   { label: 'Sleeper' }, { label: '3AC' }, { label: 'No Train' }
                                 ]).map((train: any) => (
                                   <button
                                     key={train.label}
                                     type="button"
                                     onClick={() => handleParticipantChange(index, 'trainOption', train.label)}
                                     className={cn(
                                       "py-2.5 rounded-lg font-bold text-[10px] border text-center transition-all min-h-[44px] flex items-center justify-center whitespace-normal break-words px-2 w-full",
                                       traveler.trainOption === train.label ? "bg-[#FF5B00]/10 border-[#FF5B00] text-[#FF5B00]" : "bg-white border-slate-200 text-slate-500"
                                     )}
                                   >
                                     {train.label}
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}

                          {/* Food Option for this traveler */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Food Option</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Normal Food', 'Jain Food'].map((food) => (
                                <button
                                  key={food}
                                  type="button"
                                  onClick={() => handleParticipantChange(index, 'foodPreference', food)}
                                  className={cn(
                                    "py-2.5 rounded-lg font-bold text-[10px] border text-center transition-all min-h-[44px] flex items-center justify-center whitespace-normal break-words px-2 w-full",
                                    (traveler.foodPreference || 'Normal Food') === food ? "bg-[#FF5B00]/10 border-[#FF5B00] text-[#FF5B00]" : "bg-white border-slate-200 text-slate-500"
                                  )}
                                >
                                  {food}
                                </button>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Requests textarea (optional) */}
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 space-y-4 shadow-sm">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Special Requests (Optional)</span>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#FF5B00] min-h-[100px] transition-all"
                      placeholder="Tell us about food allergies, physical requirements, room requests, or other details..."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  {/* Payment Plan */}
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm">
                                        <div className="border-b border-slate-100 pb-5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] mb-1.5">STEP 3 OF 4</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Payment Plan</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Choose your payment plan</p>
                    </div>



                    {/* Payment Mode Selection */}
                    <div className="space-y-4">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Payment Plan Selection</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('Full Payment')}
                          className={cn(
                            "text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[90px]",
                            paymentMode === 'Full Payment' ? "border-[#FF5B00] bg-[#FF5B00]/5" : "border-slate-100 bg-slate-50/50 hover:border-slate-350"
                          )}
                        >
                          <div className="flex justify-between w-full items-center">
                            <span className="text-xs font-bold capitalize text-slate-800">Pay In Full</span>
                            {paymentMode === 'Full Payment' && <Check size={14} className="text-[#FF5B00]" />}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold capitalize mt-1">Get immediate confirmation of booking</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMode('Partial Payment')}
                          className={cn(
                            "text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[90px]",
                            paymentMode === 'Partial Payment' ? "border-[#FF5B00] bg-[#FF5B00]/5" : "border-slate-100 bg-slate-50/50 hover:border-slate-350"
                          )}
                        >
                          <div className="flex justify-between w-full items-center">
                            <span className="text-xs font-bold capitalize text-slate-800">Partial Payment (Deposit)</span>
                            {paymentMode === 'Partial Payment' && <Check size={14} className="text-[#FF5B00]" />}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold capitalize mt-1">Pay only ₹{(customDepositPerPax && customDepositPerPax > 0 ? customDepositPerPax : 2000).toLocaleString()}/pax to reserve. Pay rest later.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-5">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] mb-1.5">STEP 4 OF 4</p>
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Terms & Verification</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Confirm final submission</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 text-xs font-medium text-slate-500 leading-relaxed">
                      <p>
                        By placing this booking, you verify that all traveler names, mobile numbers, and personal details match Government-issued photo IDs.
                      </p>
                      <p>
                        Cancellations, transfers, and refunds are managed strictly under the YouthCamping standard trip reservation agreement.
                      </p>
                    </div>

                    {/* Complete Booking Summary */}
                    <div className="bg-slate-50 border border-slate-150 rounded-[2rem] p-6 space-y-6">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">BOOKING SUMMARY</h4>
                        <span className="text-[9px] bg-[#FF5B00]/10 text-[#FF5B00] px-2.5 py-0.5 rounded-lg font-extrabold uppercase tracking-widest text-orange-600">PLEASE REVIEW</span>
                      </div>

                                                                  {/* Visual Priority Highlights */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Visual Priority 1: Departure Date */}
                        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-2xl space-y-1 shadow-sm">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 block">DEPARTURE DATE</span>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{initialParams.date || 'Flexible'}</p>
                        </div>

                        {/* Visual Priority 2: Package Price */}
                        <div className="bg-[#FF5B00]/5 border-l-4 border-[#FF5B00] p-4 rounded-r-2xl space-y-1 shadow-sm">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] block">PACKAGE PRICE</span>
                          <p className="text-base font-bold text-slate-900 leading-tight">₹{pricing.originalTotalBase.toLocaleString()}</p>
                        </div>

                        {/* Visual Priority 3: Amount Payable / Pay Now */}
                        <div className="bg-gradient-to-br from-[#FF5B00] to-[#FF8A00] p-4 rounded-2xl flex flex-col justify-between text-white shadow-md min-h-[70px]">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-90 block">PAY NOW</span>
                          <p className="text-xl font-bold tracking-tighter leading-tight">₹{pricing.finalTotal.toLocaleString()}</p>
                          <p className="text-[9px] font-semibold opacity-80 mt-0.5">₹{(pricing.finalTotal - pricing.depositGst).toLocaleString()} + ₹{pricing.depositGst.toLocaleString()} GST</p>
                        </div>
                      </div>

                      {/* General Booking Breakdown */}
                      <div className="bg-white border border-slate-205 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h5 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">RESERVATION DETAILS</h5>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[10px] text-[#FF5B00] hover:text-[#E65200] font-extrabold uppercase tracking-wider transition-all"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">JOINING CITY</p>
                            <p className="font-bold text-slate-800 capitalize mt-1 break-all whitespace-normal leading-tight">{selectedCity?.cityName || 'Delhi'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">DEPARTURE DATE</p>
                            <p className="font-bold text-slate-800 mt-1">{initialParams.date || 'Flexible'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">TRAVELERS</p>
                            <p className="font-bold text-slate-800 mt-1">{formData.participants} Pax</p>
                          </div>
                          {paymentMode === 'Full Payment' ? (
                            <>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">PACKAGE PRICE</p>
                                <p className="font-bold text-slate-800 mt-1">₹{pricing.originalTotalBase.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">GST @ {tripData?.gstPercentage ?? 5}%</p>
                                <p className="font-bold text-slate-800 mt-1">₹{pricing.fullPackageGst.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">PAY NOW</p>
                                <p className="font-bold text-[#FF5B00] mt-1">₹{pricing.finalTotal.toLocaleString()}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">TOTAL TRIP COST (INC. GST)</p>
                                <p className="font-bold text-slate-800 mt-1">₹{pricing.fullPackageTotal.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">BOOKING DEPOSIT (BASE)</p>
                                <p className="font-bold text-slate-800 mt-1">₹{pricing.partialBaseAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">DEPOSIT GST @ {tripData?.gstPercentage ?? 5}%</p>
                                <p className="font-bold text-slate-800 mt-1">₹{pricing.depositGst.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">PAY NOW</p>
                                <p className="font-bold text-[#FF5B00] mt-1">₹{pricing.finalTotal.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">REMAINING BALANCE</p>
                                <p className="font-extrabold text-rose-600 mt-1">₹{pricing.remainingBalance.toLocaleString()}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Section 1: Lead Contact Details */}
                      <div className="bg-white border border-slate-205 rounded-2xl p-4.5 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">1. Lead Contact</h5>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-[10px] text-[#FF5B00] hover:text-[#E65200] font-bold flex items-center gap-1 transition-all"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-400 uppercase font-medium">Name</p>
                            <p className="font-bold text-slate-800 capitalize break-words">{formData.name}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-400 uppercase font-medium">Phone</p>
                            <p className="font-bold text-slate-800 break-words">{formData.phone}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-400 uppercase font-medium">Email</p>
                            <p className="font-bold text-slate-800 break-all">{formData.email || 'N/A'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-400 uppercase font-medium">City/State</p>
                            <p className="font-bold text-slate-800 capitalize break-words">{formData.cityState}</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Traveler Details */}
                      <div className="bg-white border border-slate-205 rounded-2xl p-4.5 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">3. Traveler Details ({formData.participants})</h5>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[10px] text-[#FF5B00] hover:text-[#E65200] font-bold flex items-center gap-1 transition-all"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formData.participantsList.map((t, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between border border-slate-100 bg-slate-50/50 rounded-xl px-4 py-3 gap-2">
                              <div>
                                <p className="text-xs font-bold text-slate-800 capitalize">{t.name || `Traveler ${i+1}`}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Mobile: {t.phone} • {t.gender} • Age {t.age || 'N/A'}</p>
                              </div>
                              <div className="text-left md:text-right shrink-0">
                                <span className="inline-block text-[9px] font-bold text-slate-500 bg-white border border-slate-200/60 px-2 py-0.5 rounded mr-1 capitalize">{t.roomSharing}</span>
                                <span className="inline-block text-[9px] font-bold text-slate-500 bg-white border border-slate-200/60 px-2 py-0.5 rounded capitalize">{t.trainOption}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Mandatory T&C + optional WhatsApp opt-in checkboxes */}
                    <div className="space-y-4 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          className="mt-1 accent-[#FF5B00] rounded focus:ring-offset-slate-950"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                        />
                        <span className={cn("font-bold text-slate-700", !acceptTerms && "text-slate-500")}>
                          I agree to the terms and conditions and trip reservation guidelines * (Mandatory)
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          className="mt-1 accent-[#FF5B00] rounded focus:ring-offset-slate-950"
                          checked={whatsappOptIn}
                          onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        />
                        <span className="font-bold text-slate-700">
                          Opt-in to receive booking updates and itinerary information directly on WhatsApp (Optional)
                        </span>
                      </label>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-5 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex justify-start items-center gap-4">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  type="button"
                  className="bg-white border border-slate-200 text-slate-700 rounded-2xl py-4.5 px-8 font-bold capitalize tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
            </div>
          </div>

          {/* Right Area: Sticky Desktop Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-10 space-y-6">
              
                            {/* Summary Card */}
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] overflow-hidden shadow-md">
                <div className="p-6 md:p-8 space-y-6">
                  
                                    <div className="space-y-3">
                    <span className="text-[9px] text-[#FF5B00] font-extrabold uppercase tracking-widest block">
                      LIVE EXPEDITION SUMMARY
                    </span>
                    <h3 className="text-xl font-black capitalize tracking-tight text-slate-900 leading-tight">
                      {initialParams.tripName || 'Trip Checkout'}
                    </h3>
                  </div>

                  <div className="h-px bg-slate-100" />

                                    {/* High Visual Priority Section */}
                  <div className="space-y-3">
                    {/* Visual Priority 1: Departure Date */}
                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3.5 rounded-r-2xl space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 block">DEPARTURE DATE</span>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{initialParams.date || 'Flexible'}</p>
                    </div>

                    {/* Visual Priority 2: Package Price */}
                    <div className="bg-[#FF5B00]/5 border-l-4 border-[#FF5B00] p-3.5 rounded-r-2xl space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] block">PACKAGE PRICE</span>
                      <p className="text-base font-bold text-slate-900 leading-tight">₹{pricing.originalTotalBase.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* General Details List */}
                  <div className="space-y-3 text-xs border-t border-b border-slate-100 py-4">
                    <div className="flex items-start justify-between text-slate-650 gap-2 min-w-0">
                      <span className="flex items-center font-extrabold shrink-0 text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">JOINING CITY</span>
                      <span className="font-extrabold text-slate-900 capitalize text-right break-all max-w-[60%] inline-block leading-tight">{selectedCity?.cityName || 'Delhi'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-650 gap-2 min-w-0">
                      <span className="flex items-center font-extrabold shrink-0 text-[10px] uppercase tracking-wider text-slate-500">TRAVELERS</span>
                      <span className="font-extrabold text-slate-900 shrink-0">{formData.participants} Pax</span>
                    </div>

                    {/* Per-traveler options breakdown */}
                    {formData.participantsList.some(t => t.roomSharing !== 'Triple Sharing' || (!isDirectJoin && t.trainOption !== 'Sleeper')) && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                        {formData.participantsList.map((t, i) => {
                          const trainOpts = tripData?.travelOptions?.length > 0 ? tripData.travelOptions : [
                            { label: 'Sleeper', priceDelta: 0 }, { label: '3AC', priceDelta: 2000 }, { label: 'No Train', priceDelta: -1500 }
                          ];
                          const roomOpts = tripData?.roomOptions?.length > 0 ? tripData.roomOptions : [
                            { label: 'Triple Sharing', priceDelta: 0 }, { label: 'Double Sharing', priceDelta: 1500 }, { label: 'Quad Sharing', priceDelta: -500 }
                          ];
                          const trainDelta = isDirectJoin ? 0 : (trainOpts.find((o: any) => o.label === t.trainOption)?.priceDelta || 0);
                          const roomDelta = roomOpts.find((o: any) => o.label === t.roomSharing)?.priceDelta || 0;
                          if (trainDelta === 0 && roomDelta === 0) return null;
                          return (
                            <div key={i} className="text-[10px] text-slate-400 space-y-0.5">
                              <span className="font-bold capitalize text-slate-500">Traveler {i+1} Adjustments</span>
                              {roomDelta !== 0 && <div className="flex justify-between gap-2"><span>{t.roomSharing}</span><span className={roomDelta > 0 ? 'text-slate-600 font-bold' : 'text-emerald-600 font-bold'}>{roomDelta > 0 ? '+' : ''}₹{roomDelta.toLocaleString()}</span></div>}
                              {!isDirectJoin && trainDelta !== 0 && <div className="flex justify-between gap-2"><span>{t.trainOption}</span><span className={trainDelta > 0 ? 'text-slate-600 font-bold' : 'text-emerald-600 font-bold'}>{trainDelta > 0 ? '+' : ''}₹{trainDelta.toLocaleString()}</span></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-650 gap-2 min-w-0">
                      <span className="flex items-center font-extrabold shrink-0 text-[10px] uppercase tracking-wider text-slate-500">GST @ {tripData?.gstPercentage ?? 5}%</span>
                      <span className="font-extrabold text-slate-900 shrink-0">+₹{pricing.fullPackageGst.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Calculations & Total */}
                  <div className="space-y-4 pt-1">
                    {/* Visual Priority 3: Pay Now / Grand Total */}
                    <div className="bg-gradient-to-br from-[#FF5B00] to-[#FF8A00] p-5 rounded-3xl flex flex-col justify-between text-white shadow-xl shadow-[#FF5B00]/15">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-90 block">PAY NOW</span>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-3xl font-black tracking-tighter">₹{pricing.finalTotal.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] font-semibold opacity-80 mt-1">₹{(pricing.finalTotal - pricing.depositGst).toLocaleString()} + ₹{pricing.depositGst.toLocaleString()} GST</p>
                    </div>

                    {paymentMode === 'Partial Payment' && (
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3.5 text-xs">
                        <span className="flex items-center font-extrabold text-[10px] uppercase tracking-wider text-slate-500">REMAINING BALANCE</span>
                        <span className="font-black text-slate-900 text-sm">₹{pricing.remainingBalance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges footer */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
                  <ShieldCheck className="text-[#FF5B00]" size={16} />
                  <span className="text-[9px] font-bold capitalize tracking-wider text-slate-700">100% Secured</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
                  <Lock className="text-[#FF5B00]" size={16} />
                  <span className="text-[9px] font-bold capitalize tracking-wider text-slate-700">SSL Checkout</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Sticky Live Price Bar (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-6 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF5B00] block">LIVE PACKAGE PRICE</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">₹{pricing.finalTotal.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 font-semibold">(Inc. GST)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-[10px] font-bold text-slate-500 hidden md:block">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{formData.participants} Pax • {selectedCity?.cityName || 'Delhi'}</span>
            </div>
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                type="button"
                className="bg-[#FF5B00] hover:bg-[#E65200] text-white rounded-2xl py-3 px-6 font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5 shadow-lg shadow-[#FF5B00]/25 transition-all active:scale-95 min-h-[44px]"
              >
                Continue <ChevronRight size={12} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                type="button"
                className="bg-[#FF5B00] hover:bg-[#E65200] text-white rounded-2xl py-3 px-6 font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5 shadow-lg shadow-[#FF5B00]/35 transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {loading ? <Loader2 className="animate-spin w-3 h-3" /> : <ShieldCheck size={12} strokeWidth={3} />}
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><Loader2 className="animate-spin text-[#FF5B00] w-10 h-10" /></div>}>
        <BookingForm />
      </Suspense>
    </main>
  );
}
