import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </MainLayout>
  );
};

export default LoginPage;