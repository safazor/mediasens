from rest_framework import serializers
from .models import MediaProject

class MediaProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = MediaProject
        fields = ['id', 'owner', 'owner_username', 'title', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
