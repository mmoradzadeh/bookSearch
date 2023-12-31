const {AuthenticatonError} = require('apollo-server-express');
const {User} = require('../models');
const {signToken} = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password')
                .populate('savedBooks');
                return userData;
            }

            throw new AuthenticatonError('Must log in first');
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            console.log(args);
            const user = await User.create(args);
            const token = signToken(user);
            return {token, user};
        },

        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticatonError('Could not find user with this email');
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticatonError('Incorrect password');
            }

            const token = signToken(user);
            return {token, user};
        },

        saveBook: async (parent, {bookData}, context) => {
            if(context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$push: {savedBooks: bookData}},
                    {new: true}
                );

                return updatedUser;
            }
            throw new AuthenticatonError('Please log in first');
        },

        removeBook: async (parent, {bookId}, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId: bookId}}},
                    {new: true}
                );
            }
            return updatedUser;
            throw new AuthenticatonError('Please log in first');
        }
}};

module.exports = resolvers;