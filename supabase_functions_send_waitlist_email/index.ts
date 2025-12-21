// Supabase Edge Function to send waitlist confirmation email
// This function is triggered when a new entry is added to beta_waitlist

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@hopevisionai.com';

serve(async (req) => {
  try {
    // Get the waitlist entry from the request body
    const { record } = await req.json();

    if (!record || !record.email) {
      return new Response(
        JSON.stringify({ error: 'Missing email in record' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content based on role
    let subject = '';
    let htmlContent = '';

    if (record.role === 'patient') {
      subject = 'Bienvenue sur la Beta HopeVisionAI !';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HopeVisionAI Beta</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${record.full_name},</h2>
              <p>Merci de votre intérêt pour HopeVisionAI !</p>
              <p>Vous êtes maintenant inscrit sur notre liste d'attente Beta. Nous vous contacterons très prochainement pour vous donner accès à la plateforme.</p>
              <p>En attendant, n'hésitez pas à consulter notre site web pour en savoir plus sur nos fonctionnalités.</p>
              <p>Cordialement,<br>L'équipe HopeVisionAI</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (record.role === 'doctor') {
      subject = 'Demande Beta HopeVisionAI reçue';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HopeVisionAI Beta</h1>
            </div>
            <div class="content">
              <h2>Bonjour Dr. ${record.full_name},</h2>
              <p>Merci de votre demande d'accès à la Beta HopeVisionAI.</p>
              <p>Le module Professionnel est actuellement en phase de test privé. Notre équipe va examiner votre demande et vous contactera sous peu.</p>
              ${record.specialty ? `<p>Spécialité indiquée : ${record.specialty}</p>` : ''}
              <p>En attendant, vous pouvez planifier une démo de 15 minutes pour découvrir la plateforme.</p>
              <p>Cordialement,<br>L'équipe HopeVisionAI</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (record.role === 'hospital') {
      subject = 'Demande Beta HopeVisionAI reçue';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HopeVisionAI Beta</h1>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Merci de l'intérêt de ${record.institution_name || 'votre établissement'} pour HopeVisionAI.</p>
              <p>Le module Hôpital est actuellement en phase de test privé. Notre équipe va examiner votre demande et vous contactera sous peu pour discuter de vos besoins spécifiques.</p>
              <p>En attendant, vous pouvez planifier une démo pour découvrir comment HopeVisionAI peut transformer votre flux de travail clinique.</p>
              <p>Cordialement,<br>L'équipe HopeVisionAI</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email using Resend API
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [record.email],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.json();
        console.error('Resend API error:', error);
        throw new Error('Failed to send email');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // If no API key, just log (for development)
      console.log('Email would be sent to:', record.email);
      console.log('Subject:', subject);
      return new Response(
        JSON.stringify({ success: true, message: 'Email service not configured (development mode)' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
