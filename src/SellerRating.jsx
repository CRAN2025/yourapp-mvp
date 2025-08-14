import React, { useState } from 'react';
import { Star, MessageCircle, Shield, Users } from 'lucide-react';

const SellerRating = ({ sellerId, sellerData, showRatingForm = false, compact = false }) => {
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock rating data - will be replaced with Firebase
  const ratingData = {
    averageRating: 4.7,
    totalRatings: 23,
    ratingBreakdown: {
      5: 16,
      4: 4,
      3: 2,
      2: 1,
      1: 0
    },
    recentReviews: [
      { rating: 5, review: "Great seller! Fast response and quality products.", buyer: "John D.", date: "2 days ago" },
      { rating: 5, review: "Exactly as described. Highly recommend!", buyer: "Sarah M.", date: "1 week ago" },
      { rating: 4, review: "Good quality, quick delivery.", buyer: "Mike K.", date: "2 weeks ago" }
    ]
  };

  const renderStars = (rating, size = 16, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= rating;
      
      return (
        <Star
          key={index}
          size={size}
          style={{
            color: isFilled ? '#fbbf24' : '#d1d5db',
            fill: isFilled ? '#fbbf24' : 'transparent',
            cursor: interactive ? 'pointer' : 'default'
          }}
          onClick={interactive ? () => setUserRating(starNumber) : undefined}
        />
      );
    });
  };

  const submitRating = async () => {
    if (userRating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Save to Firebase
      console.log('Saving rating:', { sellerId, rating: userRating, review: userReview });
      
      // Reset form
      setUserRating(0);
      setUserReview('');
      setShowForm(false);
      
      alert('Thank you for your rating!');
    } catch (error) {
      console.error('Error saving rating:', error);
      alert('Failed to save rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {renderStars(ratingData.averageRating, 14)}
        </div>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
          {ratingData.averageRating}
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          ({ratingData.totalRatings} reviews)
        </span>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.95)', 
      borderRadius: '16px', 
      padding: '24px', 
      marginBottom: '24px',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Seller Header with Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #5a6bff, #67d1ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '700',
          color: 'white'
        }}>
          {sellerData?.storeName?.charAt(0) || 'S'}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
              {sellerData?.storeName || 'Store'}
            </h3>
            <Shield size={16} style={{ color: '#22c55e' }} title="Verified Seller" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {renderStars(ratingData.averageRating)}
            </div>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              {ratingData.averageRating}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              ({ratingData.totalRatings} reviews)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            background: 'rgba(90,107,255,0.1)',
            color: '#5a6bff',
            border: '1px solid rgba(90,107,255,0.2)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Star size={14} />
          Rate Seller
        </button>
      </div>

      {/* Rating Form */}
      {showForm && (
        <div style={{ 
          background: 'rgba(90,107,255,0.05)', 
          borderRadius: '12px', 
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            Rate your experience
          </h4>
          
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            {renderStars(userRating, 24, true)}
          </div>
          
          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="Share your experience (optional)"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              resize: 'vertical',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={submitRating}
              disabled={userRating === 0 || isSubmitting}
              style={{
                padding: '8px 16px',
                background: userRating > 0 ? '#22c55e' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: userRating > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rating Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>
            Rating Breakdown
          </h4>
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', width: '8px' }}>{stars}</span>
              <Star size={12} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
              <div style={{ 
                flex: 1, 
                height: '6px', 
                background: 'rgba(0,0,0,0.1)', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(ratingData.ratingBreakdown[stars] / ratingData.totalRatings) * 100}%`,
                  height: '100%',
                  background: '#fbbf24'
                }} />
              </div>
              <span style={{ fontSize: '12px', opacity: 0.6, width: '20px' }}>
                {ratingData.ratingBreakdown[stars]}
              </span>
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', opacity: 0.8 }}>
            Recent Reviews
          </h4>
          {ratingData.recentReviews.slice(0, 3).map((review, index) => (
            <div key={index} style={{ marginBottom: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {renderStars(review.rating, 10)}
                </div>
                <span style={{ fontWeight: '600' }}>{review.buyer}</span>
                <span style={{ opacity: 0.6 }}>{review.date}</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.4, opacity: 0.8 }}>
                "{review.review}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerRating;