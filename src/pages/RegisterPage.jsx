import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </MainLayout>
  );
};

export default RegisterPage;