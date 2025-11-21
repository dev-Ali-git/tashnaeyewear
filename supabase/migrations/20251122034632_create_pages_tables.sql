-- Create pages table for managing website content
CREATE TABLE IF NOT EXISTS pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pages
INSERT INTO pages (title, slug, content) VALUES
('Contact Us', 'contact-us', '<p>We''d love to hear from you! Whether you have questions about our products, need assistance with your order, or just want to say hello, our team is here to help.</p><p>Please fill out the contact form below and we''ll get back to you as soon as possible.</p>'),
('Shipping Policy', 'shipping-policy', '<h2>Shipping Information</h2><p>We offer shipping across Pakistan with the following options:</p><ul><li><strong>Standard Shipping:</strong> 3-5 business days - Rs. 200</li><li><strong>Express Shipping:</strong> 1-2 business days - Rs. 500</li><li><strong>Free Shipping:</strong> On orders over Rs. 5,000</li></ul><h3>Processing Time</h3><p>Orders are typically processed within 1-2 business days. You will receive a tracking number once your order ships.</p>'),
('Returns & Exchanges', 'returns-exchanges', '<h2>30-Day Return Policy</h2><p>We want you to love your new eyewear! If you''re not completely satisfied, you can return or exchange your purchase within 30 days.</p><h3>Return Conditions</h3><ul><li>Items must be unworn and in original condition</li><li>Original packaging must be included</li><li>Proof of purchase required</li></ul><h3>How to Return</h3><ol><li>Contact our customer service team</li><li>Receive return authorization</li><li>Ship items back to us</li><li>Receive refund or exchange within 7-10 business days</li></ol>'),
('FAQ', 'faq', '<h2>Frequently Asked Questions</h2><h3>How do I know my prescription?</h3><p>You can get your prescription from your eye doctor or optometrist. If you need help reading your prescription, our team is happy to assist.</p><h3>Can I upload my prescription?</h3><p>Yes! You can upload your prescription image during checkout or email it to us after placing your order.</p><h3>How long does it take to make prescription glasses?</h3><p>Prescription glasses typically take 5-7 business days to prepare, plus shipping time.</p><h3>Do you offer blue light blocking lenses?</h3><p>Yes, we offer various lens options including blue light blocking, transition lenses, and more.</p>'),
('Privacy Policy', 'privacy-policy', '<h2>Privacy Policy</h2><p><strong>Last updated: November 2025</strong></p><h3>Information We Collect</h3><p>We collect information that you provide directly to us, including:</p><ul><li>Name and contact information</li><li>Shipping and billing addresses</li><li>Payment information</li><li>Prescription details</li><li>Order history</li></ul><h3>How We Use Your Information</h3><p>We use your information to:</p><ul><li>Process and fulfill your orders</li><li>Communicate with you about your orders</li><li>Improve our products and services</li><li>Send you marketing communications (with your consent)</li></ul><h3>Data Security</h3><p>We implement appropriate security measures to protect your personal information.</p>'),
('Terms & Conditions', 'terms-conditions', '<h2>Terms and Conditions</h2><p><strong>Last updated: November 2025</strong></p><h3>Acceptance of Terms</h3><p>By accessing and using this website, you accept and agree to be bound by these terms and conditions.</p><h3>Products and Services</h3><p>All products and services are subject to availability. We reserve the right to discontinue any product at any time.</p><h3>Pricing</h3><p>Prices are subject to change without notice. All prices are in Pakistani Rupees (PKR).</p><h3>Intellectual Property</h3><p>All content on this website, including text, graphics, logos, and images, is the property of Tashna Eyewear and protected by copyright laws.</p>'),
('About Us', 'about-us', '<h2>About Tashna Eyewear</h2><p>Founded with a passion for exceptional eyewear, Tashna Eyewear brings you premium frames and lenses that combine style, comfort, and quality.</p><h3>Our Mission</h3><p>To provide high-quality, stylish eyewear that helps everyone see the world more clearly and confidently.</p><h3>Our Values</h3><ul><li><strong>Quality:</strong> We use only the finest materials and craftsmanship</li><li><strong>Style:</strong> Our designs blend timeless elegance with modern trends</li><li><strong>Service:</strong> Your satisfaction is our top priority</li><li><strong>Innovation:</strong> We stay ahead of the latest technology in lens design</li></ul><h3>Our Team</h3><p>Our experienced team of opticians and style consultants are dedicated to helping you find the perfect eyewear for your needs and lifestyle.</p>')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages (public read, admin write)
CREATE POLICY "Anyone can view pages"
    ON pages FOR SELECT
    USING (true);

CREATE POLICY "Admins can update pages"
    ON pages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for contact_submissions (anyone can insert, only admins can view)
CREATE POLICY "Anyone can submit contact form"
    ON contact_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view contact submissions"
    ON contact_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
