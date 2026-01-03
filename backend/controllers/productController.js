const { Product } = require('../models/Product');
const { asyncHandler } = require('../middleware/asyncHandler');
const { logger } = require('../utils/logger');
const cloudinaryService = require('../utils/cloudinary');

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private (Admin only)
const createProduct = asyncHandler(async (req, res) => {
  try {
    logger.info('Create product request received', {
      hasFiles: !!(req.files),
      filesCount: req.files ? Object.keys(req.files).length : 0,
      hasProductData: !!req.body.productData,
      bodyKeys: Object.keys(req.body),
      bodyProductData: req.body.productData,
      contentType: req.headers['content-type'],
      method: req.method,
      url: req.url,
      bodyType: typeof req.body,
      bodyString: JSON.stringify(req.body)
    });

    // Handle both JSON and FormData requests
    let productData;
    if (req.body.productData) {
      // FormData request - parse the JSON string
      try {
        productData = JSON.parse(req.body.productData);
        logger.info('Parsed product data from FormData', {
          productName: productData.productName,
          serviceType: productData.serviceType,
          categoriesCount: Object.keys(productData.categories || {}).length
        });
      } catch (parseError) {
        logger.error('Failed to parse productData JSON', {
          error: parseError.message,
          productDataString: req.body.productData
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid productData JSON format',
          error: parseError.message
        });
      }
    } else {
      // Regular JSON request
      productData = req.body;
      logger.info('Using direct body as product data', {
        productName: productData.productName,
        serviceType: productData.serviceType
      });
    }

    // Validate that we have product data
    if (!productData) {
      logger.error('No product data found in request');
      return res.status(400).json({
        success: false,
        message: 'productData is not defined',
        error: 'No product data provided in request'
      });
    }

    const { productName, serviceType, categories, categoryNames } = productData;
    let productImage = productData.productImage; // Default to URL if provided

    // Validate required fields
    if (!productName || !serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Product name and service type are required'
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    // Handle image upload if file is provided
    const productImgFile = (req.files && req.files.productImage && req.files.productImage[0]) || req.file;

    if (productImgFile) {
      try {
        logger.info('Uploading product image to Cloudinary', {
          productName: productName,
          fileSize: productImgFile.size,
          mimetype: productImgFile.mimetype
        });

        const uploadResult = await cloudinaryService.uploadProductImage(
          productImgFile.buffer,
          productName
        );

        productImage = uploadResult.secure_url;

        logger.info('Product image uploaded successfully', {
          productName: productName,
          imageUrl: productImage
        });
      } catch (uploadError) {
        logger.error('Failed to upload product image', {
          productName: productName,
          error: uploadError.message
        });

        // Don't fail the entire product creation if image upload fails
        // Just log the error and continue without image
        logger.warn('Continuing product creation without image due to upload failure', {
          productName: productName,
          error: uploadError.message
        });

        // Set productImage to null so the product can still be created
        productImage = null;
      }
    }

    // Handle service images upload
    const serviceImageUrls = {};
    if (req.files && req.files.serviceImages) {
      const serviceImageKeys = req.body.serviceImageKeys ?
        (Array.isArray(req.body.serviceImageKeys) ? req.body.serviceImageKeys : [req.body.serviceImageKeys]) : [];

      logger.info('Processing service images', {
        filesCount: req.files.serviceImages.length,
        keysCount: serviceImageKeys.length,
        keys: serviceImageKeys
      });

      for (let i = 0; i < req.files.serviceImages.length; i++) {
        const file = req.files.serviceImages[i];
        const serviceKey = serviceImageKeys[i];

        if (serviceKey && file) {
          try {
            logger.info('Uploading service image to Cloudinary', {
              serviceKey: serviceKey,
              fileSize: file.size,
              mimetype: file.mimetype
            });

            // Add timeout wrapper to prevent server crashes
            const uploadPromise = cloudinaryService.uploadServiceImage(
              file.buffer,
              `${productName}_${serviceKey}`
            );

            // Set a timeout for the upload
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
            });

            const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);

            serviceImageUrls[serviceKey] = uploadResult.secure_url;

            logger.info('Service image uploaded successfully', {
              serviceKey: serviceKey,
              imageUrl: uploadResult.secure_url
            });
          } catch (uploadError) {
            logger.error('Failed to upload service image', {
              serviceKey: serviceKey,
              error: uploadError.message,
              errorType: uploadError.name
            });

            // Don't crash the server - just continue without this service image
            logger.warn('Continuing product creation without service image', {
              serviceKey: serviceKey,
              productName: productName
            });

            // Set a placeholder or null for the service image
            serviceImageUrls[serviceKey] = null;
          }
        }
      }

      logger.info('Service image URLs mapping', {
        serviceImageUrls: serviceImageUrls
      });
    }

    // Process categories - ensure A, B, C, D structure and validate prices
    const processedCategories = {
      A: (categories?.A || []).map((service, index) => {
        const serviceImageUrl = serviceImageUrls[`A_${index}`] || service.serviceImage;
        logger.info('Processing service A', { index, serviceName: service.serviceName, serviceImageUrl });
        return {
          ...service,
          discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
          serviceImage: serviceImageUrl
        };
      }),
      B: (categories?.B || []).map((service, index) => {
        const serviceImageUrl = serviceImageUrls[`B_${index}`] || service.serviceImage;
        logger.info('Processing service B', { index, serviceName: service.serviceName, serviceImageUrl });
        return {
          ...service,
          discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
          serviceImage: serviceImageUrl
        };
      }),
      C: (categories?.C || []).map((service, index) => {
        const serviceImageUrl = serviceImageUrls[`C_${index}`] || service.serviceImage;
        logger.info('Processing service C', { index, serviceName: service.serviceName, serviceImageUrl });
        return {
          ...service,
          discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
          serviceImage: serviceImageUrl
        };
      }),
      D: (categories?.D || []).map((service, index) => {
        const serviceImageUrl = serviceImageUrls[`D_${index}`] || service.serviceImage;
        logger.info('Processing service D', { index, serviceName: service.serviceName, serviceImageUrl });
        return {
          ...service,
          discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
          serviceImage: serviceImageUrl
        };
      })
    };

    // Process category names
    const processedCategoryNames = {
      A: categoryNames?.A || 'Basic Services',
      B: categoryNames?.B || 'Premium Services',
      C: categoryNames?.C || 'Emergency Services',
      D: categoryNames?.D || 'Maintenance Services'
    };

    // Create product data
    const newProductData = {
      productName,
      productImage,
      serviceType,
      categories: processedCategories,
      categoryNames: processedCategoryNames,
      status: productData.status || 'active',
      isFeatured: !!productData.isFeatured,
      createdBy: req.admin._id
    };

    const product = await Product.create(newProductData);

    logger.info(`Product created: ${product.productName} by admin: ${req.admin.email}`, {
      productId: product._id,
      hasImage: !!productImage,
      serviceType: product.serviceType,
      totalServices: product.totalServices,
      serviceImagesCount: Object.keys(serviceImageUrls).length,
      serviceImageUrls: serviceImageUrls
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product,
        totalServices: product.totalServices
      }
    });
  } catch (error) {
    logger.error('Error creating product:', {
      error: error.message,
      stack: error.stack,
      productName: productData?.productName,
      serviceType: productData?.serviceType
    });
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @desc    Get all products with filtering and pagination
// @route   GET /api/admin/products
// @access  Private (Admin only)
const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      serviceType,
      status,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (status) {
      query.status = status;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'relevance' && search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info(`Products retrieved: ${products.length} of ${totalProducts}`, {
      query: { search, serviceType, status, isFeatured },
      pagination: { page, limit, totalPages }
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error retrieving products:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
});

// @desc    Get single product by ID
// @route   GET /api/admin/products/:id
// @access  Private (Admin only)
const getProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    logger.info(`Product retrieved: ${product.productName}`, {
      productId: product._id,
      totalServices: product.totalServices
    });

    res.json({
      success: true,
      data: {
        product,
        totalServices: product.totalServices
      }
    });
  } catch (error) {
    logger.error('Error retrieving product:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: error.message
    });
  }
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private (Admin only)
const updateProduct = asyncHandler(async (req, res) => {
  try {
    // Handle both JSON and FormData requests
    let productData;
    if (req.body.productData) {
      productData = JSON.parse(req.body.productData);
    } else {
      productData = req.body;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle product image upload if file is provided
    if (req.files && req.files.productImage) {
      try {
        logger.info('Uploading updated product image to Cloudinary', {
          productId: product._id,
          productName: product.productName,
          fileSize: req.files.productImage[0].size
        });

        const uploadResult = await cloudinaryService.uploadProductImage(
          req.files.productImage[0].buffer,
          product.productName
        );

        productData.productImage = uploadResult.secure_url;

        logger.info('Product image updated successfully', {
          productId: product._id,
          imageUrl: productData.productImage
        });
      } catch (uploadError) {
        logger.error('Failed to upload updated product image', {
          productId: product._id,
          error: uploadError.message
        });

        // Don't fail the entire product update if image upload fails
        // Just log the error and continue without updating the image
        logger.warn('Continuing product update without image due to upload failure', {
          productId: product._id,
          error: uploadError.message
        });

        // Remove productImage from update data so it doesn't get updated
        delete productData.productImage;
      }
    }

    // Handle service images upload
    const serviceImageUrls = {};
    if (req.files && req.files.serviceImages) {
      const serviceImageKeys = req.body.serviceImageKeys ?
        (Array.isArray(req.body.serviceImageKeys) ? req.body.serviceImageKeys : [req.body.serviceImageKeys]) : [];

      logger.info('Processing updated service images', {
        productId: product._id,
        filesCount: req.files.serviceImages.length,
        keysCount: serviceImageKeys.length,
        keys: serviceImageKeys
      });

      for (let i = 0; i < req.files.serviceImages.length; i++) {
        const file = req.files.serviceImages[i];
        const serviceKey = serviceImageKeys[i];

        if (serviceKey && file) {
          try {
            logger.info('Uploading updated service image to Cloudinary', {
              productId: product._id,
              serviceKey: serviceKey,
              fileSize: file.size,
              mimetype: file.mimetype
            });

            // Add timeout wrapper to prevent server crashes
            const uploadPromise = cloudinaryService.uploadServiceImage(
              file.buffer,
              `${product.productName}_${serviceKey}`
            );

            // Set a timeout for the upload
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
            });

            const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);

            serviceImageUrls[serviceKey] = uploadResult.secure_url;

            logger.info('Service image updated successfully', {
              productId: product._id,
              serviceKey: serviceKey,
              imageUrl: uploadResult.secure_url
            });
          } catch (uploadError) {
            logger.error('Failed to upload updated service image', {
              productId: product._id,
              serviceKey: serviceKey,
              error: uploadError.message,
              errorType: uploadError.name
            });

            // Don't crash the server - just continue without this service image
            logger.warn('Continuing product update without service image', {
              productId: product._id,
              serviceKey: serviceKey
            });

            // Set a placeholder or null for the service image
            serviceImageUrls[serviceKey] = null;
          }
        }
      }

      logger.info('Updated service image URLs mapping', {
        productId: product._id,
        serviceImageUrls: serviceImageUrls
      });
    }

    // Process categories if provided
    if (productData.categories) {
      productData.categories = {
        A: (productData.categories.A || []).map((service, index) => {
          // Priority: new uploaded image > existing service image from request > existing service image from database
          const existingServiceImage = product.categories?.A?.[index]?.serviceImage;
          const serviceImageUrl = serviceImageUrls[`A_${index}`] || service.serviceImage || existingServiceImage;
          logger.info('Processing updated service A', {
            productId: product._id,
            index,
            serviceName: service.serviceName,
            serviceImageUrl,
            hasNewImage: !!serviceImageUrls[`A_${index}`],
            hasRequestImage: !!service.serviceImage,
            hasExistingImage: !!existingServiceImage
          });
          return {
            ...service,
            discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
            serviceImage: serviceImageUrl
          };
        }),
        B: (productData.categories.B || []).map((service, index) => {
          const existingServiceImage = product.categories?.B?.[index]?.serviceImage;
          const serviceImageUrl = serviceImageUrls[`B_${index}`] || service.serviceImage || existingServiceImage;
          logger.info('Processing updated service B', {
            productId: product._id,
            index,
            serviceName: service.serviceName,
            serviceImageUrl,
            hasNewImage: !!serviceImageUrls[`B_${index}`],
            hasRequestImage: !!service.serviceImage,
            hasExistingImage: !!existingServiceImage
          });
          return {
            ...service,
            discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
            serviceImage: serviceImageUrl
          };
        }),
        C: (productData.categories.C || []).map((service, index) => {
          const existingServiceImage = product.categories?.C?.[index]?.serviceImage;
          const serviceImageUrl = serviceImageUrls[`C_${index}`] || service.serviceImage || existingServiceImage;
          logger.info('Processing updated service C', {
            productId: product._id,
            index,
            serviceName: service.serviceName,
            serviceImageUrl,
            hasNewImage: !!serviceImageUrls[`C_${index}`],
            hasRequestImage: !!service.serviceImage,
            hasExistingImage: !!existingServiceImage
          });
          return {
            ...service,
            discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
            serviceImage: serviceImageUrl
          };
        }),
        D: (productData.categories.D || []).map((service, index) => {
          const existingServiceImage = product.categories?.D?.[index]?.serviceImage;
          const serviceImageUrl = serviceImageUrls[`D_${index}`] || service.serviceImage || existingServiceImage;
          logger.info('Processing updated service D', {
            productId: product._id,
            index,
            serviceName: service.serviceName,
            serviceImageUrl,
            hasNewImage: !!serviceImageUrls[`D_${index}`],
            hasRequestImage: !!service.serviceImage,
            hasExistingImage: !!existingServiceImage
          });
          return {
            ...service,
            discountPrice: service.discountPrice && service.discountPrice > 0 ? service.discountPrice : undefined,
            serviceImage: serviceImageUrl
          };
        })
      };
    }

    // Process category names if provided
    if (productData.categoryNames) {
      productData.categoryNames = {
        A: productData.categoryNames.A || 'Basic Services',
        B: productData.categoryNames.B || 'Premium Services',
        C: productData.categoryNames.C || 'Emergency Services',
        D: productData.categoryNames.D || 'Maintenance Services'
      };
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...productData,
        updatedBy: req.admin._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    logger.info(`Product updated: ${updatedProduct.productName} by admin: ${req.admin.email}`, {
      productId: updatedProduct._id,
      changes: Object.keys(productData),
      serviceImagesCount: Object.keys(serviceImageUrls).length,
      serviceImageUrls: serviceImageUrls
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: updatedProduct,
        totalServices: updatedProduct.totalServices
      }
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete product image from Cloudinary if exists
    if (product.productImage) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = product.productImage.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const folder = `fixifly/products/${product.productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        await cloudinaryService.deleteImage(`${folder}/${publicId}`);
        logger.info('Product image deleted from Cloudinary', {
          productId: product._id,
          imageUrl: product.productImage
        });
      } catch (deleteError) {
        logger.warn('Failed to delete product image from Cloudinary', {
          productId: product._id,
          error: deleteError.message
        });
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    logger.info(`Product deleted: ${product.productName} by admin: ${req.admin.email}`, {
      productId: product._id
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// @desc    Update product status
// @route   PATCH /api/admin/products/:id/status
// @access  Private (Admin only)
const updateProductStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, archived'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.admin._id },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    logger.info(`Product status updated: ${product.productName} to ${status} by admin: ${req.admin.email}`, {
      productId: product._id,
      newStatus: status
    });

    res.json({
      success: true,
      message: 'Product status updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      error: error.message
    });
  }
});

// @desc    Toggle product featured status
// @route   PATCH /api/admin/products/:id/featured
// @access  Private (Admin only)
const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isFeatured = !product.isFeatured;
    product.updatedBy = req.admin._id;
    await product.save();

    logger.info(`Product featured status toggled: ${product.productName} to ${product.isFeatured} by admin: ${req.admin.email}`, {
      productId: product._id
    });

    res.json({
      success: true,
      message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: product
    });
  } catch (error) {
    logger.error('Error toggling product featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured status',
      error: error.message
    });
  }
});

// @desc    Get product statistics
// @route   GET /api/admin/products/stats
// @access  Private (Admin only)
const getProductStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          draftProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          featuredProducts: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          }
        }
      }
    ]);

    const serviceTypeStats = await Product.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('productName status createdAt')
      .populate('createdBy', 'name');

    const result = {
      overview: stats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        draftProducts: 0,
        inactiveProducts: 0,
        featuredProducts: 0
      },
      serviceTypeBreakdown: serviceTypeStats || [],
      recentProducts: recentProducts || []
    };

    logger.info('Product statistics retrieved', {
      totalProducts: result.overview.totalProducts,
      activeProducts: result.overview.activeProducts
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error retrieving product statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving product statistics',
      error: error.message
    });
  }
});

// @desc    Add service to product category
// @route   POST /api/admin/products/:id/categories/:categoryKey/services
// @access  Private (Admin only)
const addServiceToCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryKey } = req.params;
    const serviceData = req.body;

    if (!['A', 'B', 'C', 'D'].includes(categoryKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category key. Must be A, B, C, or D'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.addServiceToCategory(categoryKey, serviceData);

    logger.info(`Service added to product category: ${product.productName} - ${product.getCategoryName(categoryKey)}`, {
      productId: product._id,
      categoryKey,
      serviceName: serviceData.serviceName
    });

    res.json({
      success: true,
      message: 'Service added to category successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error adding service to category:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding service to category',
      error: error.message
    });
  }
});

// @desc    Remove service from product category
// @route   DELETE /api/admin/products/:id/categories/:categoryKey/services/:serviceId
// @access  Private (Admin only)
const removeServiceFromCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryKey, serviceId } = req.params;

    if (!['A', 'B', 'C', 'D'].includes(categoryKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category key. Must be A, B, C, or D'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.removeServiceFromCategory(categoryKey, serviceId);

    logger.info(`Service removed from product category: ${product.productName} - ${product.getCategoryName(categoryKey)}`, {
      productId: product._id,
      categoryKey,
      serviceId
    });

    res.json({
      success: true,
      message: 'Service removed from category successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error removing service from category:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing service from category',
      error: error.message
    });
  }
});

// @desc    Get top 3 featured products for hero section
// @route   GET /api/public/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  try {
    const featuredProducts = await Product.find({
      isFeatured: true,
      status: 'active'
    })
      .select('productName productImage serviceType categories categoryNames')
      .sort({ updatedAt: -1 }) // Sort by most recently updated featured products
      .limit(3)
      .lean();

    logger.info(`Featured products retrieved: ${featuredProducts.length}`, {
      productNames: featuredProducts.map(p => p.productName)
    });

    res.json({
      success: true,
      data: {
        products: featuredProducts,
        count: featuredProducts.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving featured products',
      error: error.message
    });
  }
});

// @desc    Get all active products for hero section
// @route   GET /api/public/products/all
// @access  Public
const getAllActiveProducts = asyncHandler(async (req, res) => {
  try {
    const allProducts = await Product.find({
      status: 'active'
    })
      .select('productName productImage serviceType categories categoryNames isFeatured')
      .sort({ isFeatured: -1, updatedAt: -1 }) // Sort featured products first, then by updated date
      .lean();

    logger.info(`All active products retrieved: ${allProducts.length}`, {
      featuredCount: allProducts.filter(p => p.isFeatured).length,
      totalCount: allProducts.length
    });

    res.json({
      success: true,
      data: {
        products: allProducts,
        count: allProducts.length
      }
    });
  } catch (error) {
    logger.error('Error retrieving all active products:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all active products',
      error: error.message
    });
  }
});

// @desc    Get single product by ID for public access
// @route   GET /api/public/products/:id
// @access  Public
const getPublicProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: 'active'
    })
      .select('productName productImage serviceType categories categoryNames isFeatured')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not active'
      });
    }

    logger.info(`Public product retrieved: ${product.productName}`, {
      productId: product._id,
      isFeatured: product.isFeatured
    });

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    logger.error('Error retrieving public product:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: error.message
    });
  }
});

// @desc    Get products by service type for public access
// @route   GET /api/public/products/service-type/:serviceType
// @access  Public
const getProductsByServiceType = asyncHandler(async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { limit = 6 } = req.query;

    const products = await Product.find({
      serviceType: serviceType,
      status: 'active'
    })
      .select('productName productImage serviceType categories categoryNames isFeatured')
      .sort({ isFeatured: -1, updatedAt: -1 }) // Sort featured products first, then by updated date
      .limit(parseInt(limit))
      .lean();

    logger.info(`Products by service type retrieved: ${products.length} for ${serviceType}`, {
      serviceType,
      productNames: products.map(p => p.productName)
    });

    res.json({
      success: true,
      data: {
        products,
        count: products.length,
        serviceType
      }
    });
  } catch (error) {
    logger.error('Error retrieving products by service type:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving products',
      error: error.message
    });
  }
});

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  toggleFeaturedStatus,
  getProductStats,
  addServiceToCategory,
  removeServiceFromCategory,
  getFeaturedProducts,
  getAllActiveProducts,
  getPublicProductById,
  getProductsByServiceType
};